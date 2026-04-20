/**
 * Edge proxy — route-level auth gate + proactive refresh.
 *
 * Next.js 16 renamed `middleware.ts` → `proxy.ts`. Same runtime, same
 * API; filename + exported-function name change only.
 *
 * Scope: every auth-sensitive route passes through here so Server
 * Components downstream always see fresh cookies on the SAME request.
 *   /dashboard/*  — authenticated surfaces.
 *   /cart/*       — top-level cart route.
 *   /books/*      — public catalog + ownership-lookup touches.
 *   /reader/*     — secure reader requires a valid session.
 *
 * Flow:
 *   1. Both cookies gone → redirect to /login (for auth-required routes)
 *      or pass through as guest (for public routes in the matcher).
 *   2. Access token present and >60s from expiry → pass through. Fast path.
 *   3. Access token missing / near-expiry with refresh token → call
 *      POST /auth/refresh here in the edge runtime, write the rotated
 *      tokens to BOTH request.cookies (so the current SSR render sees
 *      them) AND response.cookies (so the browser persists them).
 *   4. Refresh fails → clear stale cookies; redirect auth-required
 *      routes to /login, pass through public routes as guest.
 *
 * WHY cookies get written twice (request + response):
 *   - `response.cookies.set` sends Set-Cookie headers to the browser
 *     so subsequent requests carry the new values.
 *   - `request.cookies.set` + `NextResponse.next({ request })` updates
 *     the in-flight request's cookie jar so the downstream Server
 *     Component reads the NEW tokens via `cookies().get()` during THIS
 *     render. Without this, the SSR render still sees the stale tokens
 *     and hits 401 immediately — even though the browser eventually
 *     got the new ones. This is the subtle desync that causes the
 *     "refresh succeeds but user still gets logged out" loop.
 *
 * Errors during the refresh fetch fall through to `NextResponse.next()`
 * — the in-app interceptor gets a last chance to recover on this
 * request. The proxy must never throw and crash a user page.
 */

import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "ebook_access_token";
const REFRESH_TOKEN_COOKIE = "ebook_refresh_token";
const DEVICE_FP_COOKIE = "ebook_device_fp";

// TTLs duplicated from auth.cookies.ts — the Edge runtime can't import
// from `server-only` modules, so the two files must be kept in sync.
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080/ebook";
// Default-secure except in development — matches auth.cookies.ts.
const COOKIE_SECURE = process.env.NODE_ENV !== "development";

/** Refresh proactively once the access token is within this window of expiry. */
const REFRESH_IF_WITHIN_MS = 60_000;

/** Decode the JWT payload without verifying. Edge-safe: no Buffer. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

function isAccessFresh(token: string | undefined): boolean {
  if (!token) return false;
  const claims = decodeJwtPayload(token);
  if (!claims?.exp) return false;
  return claims.exp * 1000 > Date.now() + REFRESH_IF_WITHIN_MS;
}

function loginRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Rebuild the `cookie` request header with rotated auth tokens in place
 * of the stale ones. Other cookies (device fingerprint, user info, etc.)
 * are preserved byte-for-byte.
 *
 * Splitting on `;` + trimming is the robust way — cookie values never
 * contain `;` or `=` without URL-encoding, so simple string ops are safe.
 */
function buildRewrittenCookieHeader(
  original: string | null,
  accessToken: string,
  refreshToken: string
): string {
  const parts = (original ?? "")
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);

  let sawAccess = false;
  let sawRefresh = false;

  const rewritten = parts.map((part) => {
    if (part.startsWith(`${ACCESS_TOKEN_COOKIE}=`)) {
      sawAccess = true;
      return `${ACCESS_TOKEN_COOKIE}=${accessToken}`;
    }
    if (part.startsWith(`${REFRESH_TOKEN_COOKIE}=`)) {
      sawRefresh = true;
      return `${REFRESH_TOKEN_COOKIE}=${refreshToken}`;
    }
    return part;
  });

  // If the original had no auth cookies at all (shouldn't happen on the
  // refresh path, but defensive), append the fresh ones.
  if (!sawAccess) rewritten.push(`${ACCESS_TOKEN_COOKIE}=${accessToken}`);
  if (!sawRefresh) rewritten.push(`${REFRESH_TOKEN_COOKIE}=${refreshToken}`);

  return rewritten.join("; ");
}

function writeRotatedCookiesToResponse(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function proxy(req: NextRequest) {
  const access = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const pathname = req.nextUrl.pathname;
  const requiresAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/cart");

  // Both cookies gone. Auth-required → /login; public-in-matcher → guest.
  if (!access && !refresh) {
    if (requiresAuth) return loginRedirect(req);
    return NextResponse.next();
  }

  // Fast path: access token fresh enough → pass through unchanged.
  if (isAccessFresh(access)) return NextResponse.next();

  // Slow path: access is stale / missing but refresh token exists → rotate.
  if (refresh) {
    try {
      const deviceFp = req.cookies.get(DEVICE_FP_COOKIE)?.value ?? "bff-edge";
      // 8s hard cap — a cold backend (Render free tier cold-starts,
      // network hiccup, proxy stall) must not freeze every user page
      // behind a shared edge call. Matches the in-app interceptor's
      // REFRESH_TIMEOUT_MS budget so behavior is symmetric across
      // the two refresh paths.
      const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          refreshToken: refresh,
          deviceFingerprint: deviceFp,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });

      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          data?: { accessToken?: string; refreshToken?: string };
        } | null;
        const tokens = json?.data;
        if (tokens?.accessToken && tokens?.refreshToken) {
          // CRITICAL — propagate rotated tokens to THIS render.
          //
          // Next.js middleware has a known subtlety: `response.cookies.set`
          // only reaches the BROWSER. To make the Server Component on the
          // current request read the new tokens via `cookies().get()`, we
          // must rewrite the inbound `cookie` header and forward it via
          // `NextResponse.next({ request: { headers } })`.
          //
          // `req.cookies.set()` is documented to do this implicitly, but
          // the behaviour across Next.js versions + Turbopack has been
          // inconsistent. We rewrite the header string explicitly so
          // there's no ambiguity.
          const rewrittenCookie = buildRewrittenCookieHeader(
            req.headers.get("cookie"),
            tokens.accessToken,
            tokens.refreshToken
          );
          const forwardedHeaders = new Headers(req.headers);
          forwardedHeaders.set("cookie", rewrittenCookie);

          const response = NextResponse.next({
            request: { headers: forwardedHeaders },
          });
          writeRotatedCookiesToResponse(
            response,
            tokens.accessToken,
            tokens.refreshToken
          );

          if (process.env.NODE_ENV !== "production") {
            console.log(
              "[proxy] rotated tokens and propagated to current request"
            );
          }
          return response;
        }
      }

      // Backend rejected the refresh — both tokens are now useless.
      // Clear them so the user starts fresh next request.
      if (requiresAuth) {
        const redirect = loginRedirect(req);
        redirect.cookies.delete(ACCESS_TOKEN_COOKIE);
        redirect.cookies.delete(REFRESH_TOKEN_COOKIE);
        return redirect;
      }
      const passthrough = NextResponse.next();
      passthrough.cookies.delete(ACCESS_TOKEN_COOKIE);
      passthrough.cookies.delete(REFRESH_TOKEN_COOKIE);
      return passthrough;
    } catch {
      // Network hiccup / Edge error — defer to the in-app interceptor.
      return NextResponse.next();
    }
  }

  // Access stale, no refresh available.
  if (requiresAuth) return loginRedirect(req);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cart/:path*",
    "/books/:path*",
    "/reader/:path*",
  ],
};
