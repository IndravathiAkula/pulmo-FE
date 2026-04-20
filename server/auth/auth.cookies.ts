import "server-only";

/**
 * Cookie management — the ONLY place tokens are read/written.
 *
 * Next.js 16: `cookies()` is async → must `await`.
 *
 * Security settings:
 *  - httpOnly: true    → JS cannot read tokens
 *  - secure: true      → HTTPS only (disabled in dev)
 *  - sameSite: "lax"   → CSRF protection
 *  - path: "/"         → available to all routes
 *
 * Also manages:
 *  - Device fingerprint cookie (login, refresh, logout)
 *  - User info cookie (profile data cached from login)
 */

import { cookies, headers } from "next/headers";
import type { AuthTokens, UserProfile } from "../api/apiTypes";

const COOKIE_OPTIONS = {
  httpOnly: true,
  // Default-secure: only treat `development` as permissive. Covers prod,
  // staging, preview, test, and any future env label without leaking
  // tokens over HTTP when someone forgets to set NODE_ENV=production.
  secure: process.env.NODE_ENV !== "development",
  sameSite: "lax" as const,
  path: "/",
};

const ACCESS_TOKEN_KEY = "ebook_access_token";
const REFRESH_TOKEN_KEY = "ebook_refresh_token";
const DEVICE_FP_KEY = "ebook_device_fp";
const USER_INFO_KEY = "ebook_user_info";

/**
 * Next.js forbids cookie writes from Server Components — only Server
 * Actions and Route Handlers may mutate cookies. When auth code runs
 * inside a Server Component (e.g. the BFF interceptor triggered by a
 * page's own data-fetching call), `cookieStore.set` / `.delete` throws
 * a cryptic error.
 *
 * Silently swallow that specific failure so upstream auth logic
 * (refresh, logout) can keep flowing — the interceptor's redirect
 * path takes over from there. Other errors propagate normally.
 */
function swallowReadOnlyCookieError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("can only be modified in a Server Action")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth.cookies] Skipped cookie write (Server Component context). " +
          "Interceptor will redirect to /login on terminal auth failure."
      );
    }
    return;
  }
  throw err;
}

// Access token — short-lived (matches backend expiresIn: 900s)
const ACCESS_TOKEN_MAX_AGE = 15 * 60;

// Refresh token — long-lived (7 days)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

// Device fingerprint — persist across sessions
const DEVICE_FP_MAX_AGE = 365 * 24 * 60 * 60;

// ─── Token Getters ───────────────────────────────────────────

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value;
}

// ─── Token Setters ───────────────────────────────────────────

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    cookieStore.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  } catch (err) {
    swallowReadOnlyCookieError(err);
  }
}

// ─── Clear (logout) ─────────────────────────────────────────

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  try {
    cookieStore.delete(ACCESS_TOKEN_KEY);
    cookieStore.delete(REFRESH_TOKEN_KEY);
    cookieStore.delete(USER_INFO_KEY);
  } catch (err) {
    swallowReadOnlyCookieError(err);
  }
}

// ─── Session check ───────────────────────────────────────────

export async function hasValidSession(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

// ─── User Info Cookie ────────────────────────────────────────
/**
 * Stores serialized profile data in a cookie so that
 * getSession() (in Server Components) can read user info
 * without making an API call.
 *
 * This avoids the problem of calling getProfile() from a
 * Server Component — which would trigger the interceptor's
 * refresh-retry, which tries to write cookies, which is
 * forbidden in Server Component context.
 */

export async function setUserInfoCookie(profile: UserProfile): Promise<void> {
  const cookieStore = await cookies();
  const serialized = JSON.stringify({
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  });

  try {
    cookieStore.set(USER_INFO_KEY, serialized, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE, // lives as long as the session
    });
  } catch (err) {
    swallowReadOnlyCookieError(err);
  }
}

export async function getUserInfo(): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_INFO_KEY)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Device Fingerprint ──────────────────────────────────────
/**
 * Generates a deterministic device fingerprint from server-side
 * request headers. Stored in an HttpOnly cookie so it stays
 * consistent across requests from the same browser.
 *
 * In BFF architecture the browser never generates or sees this
 * value — it's entirely server-managed.
 */
export async function getDeviceFingerprint(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEVICE_FP_KEY)?.value;

  if (existing) return existing;

  // Generate from request headers
  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "unknown";
  const lang = headersList.get("accept-language") ?? "unknown";
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const raw = `${ua}|${lang}|${ip}`;

  // Simple hash (no crypto dependency needed — this is not security-critical)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const fingerprint = `bff-${Math.abs(hash).toString(36)}`;

  // Persist so it stays consistent for this browser. May fail inside
  // a Server Component — in that case we still return the generated
  // value for this request; the next writable context will persist it.
  try {
    cookieStore.set(DEVICE_FP_KEY, fingerprint, {
      ...COOKIE_OPTIONS,
      maxAge: DEVICE_FP_MAX_AGE,
    });
  } catch (err) {
    swallowReadOnlyCookieError(err);
  }

  return fingerprint;
}
