import "server-only";

/**
 * Interceptor — the BFF's token management layer.
 *
 * Flow:
 *  1. Read accessToken from HttpOnly cookie.
 *  2. Attach as Authorization: Bearer header.
 *  3. Call rawFetch.
 *  4. If 401 AND we haven't retried yet:
 *       a. Coalesce with any in-flight refresh for the SAME refresh token
 *          (single-flight) — only ONE POST /auth/refresh fires per token,
 *          no matter how many requests race.
 *       b. Bound that refresh with a hard timeout so a hung network call
 *          can't freeze every waiter indefinitely.
 *       c. On success, the winner writes the rotated access + refresh
 *          tokens into cookies; waiters reuse the new access token to
 *          retry their original request.
 *       d. On failure (error or timeout), all waiters clear cookies and
 *          throw 401.
 *  5. Otherwise throw the error up to the service layer.
 *
 * Why single-flight keyed by refresh token (not a bare module-global
 * promise):
 *  - The backend rotates the refresh token on every /auth/refresh call.
 *    If two concurrent refreshes both POST with the same old token, the
 *    first succeeds and the second is rejected by the now-revoked token
 *    → the user is logged out despite having a valid session. Classic
 *    race. The coalesced promise fires /auth/refresh exactly once.
 *  - A bare module-global promise would couple DIFFERENT users served by
 *    the same Node instance. A waiter coming from user B would reuse
 *    user A's access token from the shared promise — a serious leak.
 *    Keying by refresh token scopes the coalesce to one session.
 *
 * Why a hard timeout on the shared refresh:
 *  - The whole point of single-flight is "everyone shares one promise."
 *    That also means if that one promise never settles (stalled proxy,
 *    half-closed stream, missing response), EVERY waiter is stuck. The
 *    timeout converts a silent hang into a clean `{ ok: false }` so all
 *    waiters get unblocked and the user sees a normal session-expired
 *    state instead of a frozen app.
 *  - The timeout outcome is a resolved value, never a rejection, to
 *    keep the "shared promise never rejects" invariant that waiters
 *    rely on.
 *
 * Cookie-write context:
 *  - Next.js forbids cookie writes from Server Components; only Server
 *    Actions / Route Handlers may mutate cookies. `auth.cookies` writes
 *    silently no-op in that context, so a refresh-success from inside a
 *    Server Component won't persist the new tokens (not great — the
 *    user will 401 again next request — but it's recoverable).
 *  - On TERMINAL auth failure the interceptor `redirect("/login")`s
 *    instead of throwing. `redirect()` works from every server context
 *    and is the user outcome we want anyway (dead session → login). The
 *    NEXT_REDIRECT it throws is caught by Next.js at the response
 *    boundary; callers that previously `catch`-ed `UnauthorizedError`
 *    from auth failure no longer need that branch.
 */

import { redirect } from "next/navigation";
import type { ApiRequestOptions, ApiResult, RefreshResponse } from "./apiTypes";
import { rawFetch } from "./apiClient";
import { AUTH_ROUTES } from "./apiRoutes";
import { UnauthorizedError } from "./errors";
import {
  getAccessToken,
  getRefreshToken,
  getDeviceFingerprint,
  setAuthCookies,
  clearAuthCookies,
} from "../auth/auth.cookies";

export async function withInterceptor<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
  const extraHeaders: Record<string, string> = {};

  // ── Step 1: Attach access token ────────────────────────
  if (!options.skipAuth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      extraHeaders["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  // ── Step 2: Execute request ────────────────────────────
  try {
    return await rawFetch<T>(url, options, extraHeaders);
  } catch (error) {
    // ── Step 3: Handle 401 with refresh retry ────────────
    if (
      error instanceof UnauthorizedError &&
      !options.skipAuth &&
      !options.skipRetry
    ) {
      return attemptRefreshAndRetry<T>(url, options);
    }
    throw error;
  }
}

// ─── Single-flight refresh plumbing ──────────────────────────

type RefreshOutcome =
  | { ok: true; accessToken: string }
  | { ok: false };

/**
 * Hard cap on how long the coalesced refresh can run before all waiters
 * are released with `{ ok: false }`. 8s is comfortably above a healthy
 * refresh latency (<1s typical) while short enough that a hung proxy or
 * dropped response can't freeze the whole app.
 */
const REFRESH_TIMEOUT_MS = 15_000;

/**
 * Pending refresh promises keyed by the refresh token that triggered
 * them. Any concurrent 401 with the same refresh token joins the same
 * in-flight promise instead of firing its own /auth/refresh. Entries
 * auto-evict via `.finally` so the Map stays bounded.
 */
const inflightRefreshes = new Map<string, Promise<RefreshOutcome>>();

/**
 * Actually calls /auth/refresh with a timeout guard. Catches every
 * failure mode and normalises to a `RefreshOutcome` — waiters on the
 * singleton must never see a rejected promise (that would mean one
 * waiter's crash fails every other waiter too).
 *
 * Idempotency: once the timeout wins, a late-arriving network response
 * from the racing `rawFetch` must NOT write tokens into cookies. The
 * `settled` flag short-circuits the post-fetch work so we don't
 * accidentally "un-log-out" a user whose waiters already got
 * `{ ok: false }` and called `clearAuthCookies`.
 */
async function performRefresh(
  refreshToken: string
): Promise<RefreshOutcome> {
  let settled = false;

  const doRefresh = async (): Promise<RefreshOutcome> => {
    try {
      const deviceFingerprint = await getDeviceFingerprint();

      const refreshResult = await rawFetch<RefreshResponse>(
        AUTH_ROUTES.refresh,
        {
          method: "POST",
          body: { refreshToken, deviceFingerprint },
          skipAuth: true,
          skipRetry: true,
        }
      );

      // Timeout already won — bail before touching cookies. The late
      // response is discarded; the waiters have moved on.
      if (settled) return { ok: false };

      if (!refreshResult.ok) {
        return { ok: false };
      }

      // Rotation: persist BOTH the new access token and the new refresh
      // token. Skipping the refresh token write would permanently brick
      // the session on the next refresh (old token is revoked server-side).
      await setAuthCookies({
        accessToken: refreshResult.data.accessToken,
        refreshToken: refreshResult.data.refreshToken,
      });

      return { ok: true, accessToken: refreshResult.data.accessToken };
    } catch {
      // Network hiccup, malformed response, 4xx/5xx from /auth/refresh —
      // all collapse to "refresh failed, log the user out cleanly."
      return { ok: false };
    }
  };

  // Timeout resolves (never rejects) so the shared promise stays safe.
  // `clearTimeout` below prevents a leaked handle when the refresh
  // wins the race — important on long-running Node servers.
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<RefreshOutcome>((resolve) => {
    timeoutHandle = setTimeout(() => resolve({ ok: false }), REFRESH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([doRefresh(), timeoutPromise]);
  } finally {
    settled = true;
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

/**
 * Gets the in-flight refresh for `refreshToken`, or starts one and
 * registers it. Callers await the returned promise and branch on the
 * outcome.
 */
function coalesceRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const existing = inflightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = performRefresh(refreshToken).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, promise);
  return promise;
}

// ─── Refresh + Retry (single attempt, coalesced) ─────────────
/**
 * Terminal auth failure — best-effort cookie clear, then redirect to
 * /login. `redirect()` throws NEXT_REDIRECT which Next.js catches at
 * the response boundary; this function's return type of `never`
 * reflects that control never returns normally.
 *
 * Public (skipAuth) calls that hit a spurious 401 still propagate as
 * UnauthorizedError via the caller at `withInterceptor` — this helper
 * only runs on the authenticated-failure path.
 */
async function terminateSession(): Promise<never> {
  await clearAuthCookies();
  redirect("/login");
}

async function attemptRefreshAndRetry<T>(
  originalUrl: string,
  originalOptions: ApiRequestOptions
): Promise<ApiResult<T>> {
  const refreshToken = await getRefreshToken();

  // `return terminateSession()` (not `await`) so TypeScript narrows
  // `refreshToken` / `outcome` on the surviving branch — `Promise<never>`
  // doesn't flow through `await` for control-flow analysis.
  if (!refreshToken) {
    return terminateSession();
  }

  const outcome = await coalesceRefresh(refreshToken);

  if (!outcome.ok) {
    return terminateSession();
  }

  // Retry the original request with the fresh access token. We use
  // the value returned from performRefresh (not another cookie read)
  // so waiters don't race against cookie-write propagation.
  const retryHeaders: Record<string, string> = {
    Authorization: `Bearer ${outcome.accessToken}`,
  };

  return rawFetch<T>(
    originalUrl,
    { ...originalOptions, skipRetry: true },
    retryHeaders
  );
}
