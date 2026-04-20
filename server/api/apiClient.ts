import "server-only";

/**
 * Server-only API client.
 *
 * Architecture:
 *  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
 *  │  Service     │ ──► │  apiClient   │ ──► │ interceptor  │
 *  │  (auth.svc)  │     │  (this file) │     │ (token mgmt) │
 *  └─────────────┘     └──────────────┘     └─────────────┘
 *
 * Only this module ever calls fetch() against the backend.
 * The `server-only` import guarantees a build error if any
 * client component tries to import this.
 */

import type {
  ApiRequestOptions,
  ApiResult,
  BackendSuccessResponse,
  BackendErrorResponse,
} from "./apiTypes";
import { createApiError, NetworkError } from "./errors";
import { withInterceptor } from "./apiInterceptor";

// ─── Raw fetch (no interceptor) ──────────────────────────────
export async function rawFetch<T>(
  url: string,
  options: ApiRequestOptions = {},
  extraHeaders: Record<string, string> = {}
): Promise<ApiResult<T>> {
  const { method = "GET", body, headers = {} } = options;

  // FormData bodies are sent as multipart/form-data — the runtime MUST
  // set the Content-Type itself so the boundary parameter is correct.
  // Never stringify FormData; pass it through as-is.
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...headers,
    ...extraHeaders,
  };

  const fetchBody: BodyInit | undefined = isFormData
    ? (body as FormData)
    : body
      ? JSON.stringify(body)
      : undefined;

  try {
    const res = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: fetchBody,
      cache: "no-store", // BFF calls should never be cached by Next.js
    });

    // ── Success envelope ──────────────────────────────────
    if (res.ok) {
      const json = (await res.json()) as BackendSuccessResponse<T>;
      return { ok: true, data: json.data, message: json.message };
    }

    // ── Error envelope ────────────────────────────────────
    const errorJson = (await res.json().catch(() => null)) as BackendErrorResponse | null;

    const baseMessage =
      errorJson?.message ?? res.statusText ?? "Request failed";

    // Rate-limit (429): the backend always sends `Retry-After` as a
    // number of seconds. Parse it, build a friendly message that tells
    // the user exactly when they can try again, and stash the parsed
    // value on the error so callers (toast handlers, optional retry
    // logic) can inspect it without re-parsing the message text.
    if (res.status === 429) {
      const retryHeader = res.headers.get("Retry-After");
      const parsed = retryHeader !== null ? Number(retryHeader) : NaN;
      const retryAfterSeconds =
        Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : null;

      const friendly = retryAfterSeconds
        ? `${baseMessage} — please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`
        : `${baseMessage} — please try again in a moment.`;

      throw createApiError(429, friendly, { retryAfterSeconds });
    }

    throw createApiError(res.status, baseMessage);
  } catch (err) {
    // Re-throw domain errors as-is
    if (err instanceof Error && "status" in err) throw err;

    // Network failures (ECONNREFUSED, DNS, timeouts, etc.)
    throw new NetworkError(
      err instanceof Error ? err.message : "Backend unreachable"
    );
  }
}

// ─── Public API (with interceptor) ───────────────────────────
/**
 * The function every service layer calls.
 * Passes through the interceptor which attaches tokens and
 * handles 401 refresh-retry.
 */
export async function apiClient<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
  return withInterceptor<T>(url, options);
}
