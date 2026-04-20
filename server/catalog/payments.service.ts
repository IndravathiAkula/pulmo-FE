import "server-only";

/**
 * Payments service — `/payments*` endpoints.
 *
 * Three surfaces:
 *  1. Direct "Buy Now" checkout — `POST /payments/checkout` with `{ bookIds }`.
 *     Idempotent via `Idempotency-Key`; the service always sends one.
 *  2. Purchase history — `GET /payments/my` (always paged).
 *  3. Purchased-books library — `GET /payments/my/books` (always paged).
 *
 * Per the API doc, these endpoints are paged-by-default (no legacy
 * unbounded fallback). Defaults: `page=0`, `size=20`.
 */

import { apiClient } from "../api/apiClient";
import { PAYMENT_ROUTES, withQuery } from "../api/apiRoutes";
import type {
  ApiResult,
  DirectCheckoutRequest,
  PagedQuery,
  PagedResponse,
  PaymentResponse,
  UserBookResponse,
} from "../api/apiTypes";

export const paymentsService = {
  /**
   * Direct Buy Now — charges the caller for the given books without
   * touching the cart. `Idempotency-Key` is always sent.
   */
  async checkout(
    data: DirectCheckoutRequest,
    idempotencyKey?: string
  ): Promise<ApiResult<PaymentResponse>> {
    const key = idempotencyKey ?? crypto.randomUUID();
    return apiClient<PaymentResponse>(PAYMENT_ROUTES.checkout, {
      method: "POST",
      body: data,
      headers: { "Idempotency-Key": key },
    });
  },

  /** Caller's transaction history. Sort fields: `createdAt`, `amount`, `status`. */
  async listMy(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<PaymentResponse>>> {
    return apiClient<PagedResponse<PaymentResponse>>(
      withQuery(PAYMENT_ROUTES.myList, {
        page: query.page ?? 0,
        size: query.size ?? 20,
        sort: query.sort,
      }),
      { method: "GET" }
    );
  },

  async getMy(id: string): Promise<ApiResult<PaymentResponse>> {
    return apiClient<PaymentResponse>(PAYMENT_ROUTES.myDetail(id), {
      method: "GET",
    });
  },

  /** Caller's purchased-book library. Sort fields: `accessGrantedAt`, `lastReadAt`. */
  async listMyBooks(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<UserBookResponse>>> {
    return apiClient<PagedResponse<UserBookResponse>>(
      withQuery(PAYMENT_ROUTES.myBooks, {
        page: query.page ?? 0,
        size: query.size ?? 20,
        sort: query.sort,
      }),
      { method: "GET" }
    );
  },

  /**
   * Fast ownership-lookup helper — returns a Set of owned book IDs for
   * O(1) membership tests. Pages through the full library so libraries
   * larger than the first page aren't silently truncated (previously
   * capped at 100 → double-purchase risk for power users).
   *
   * Pulls at size=100 per page and stops at `totalPages`. A hard safety
   * cap (`MAX_PAGES`) limits worst-case fan-out to 50 requests = 5,000
   * books; beyond that we return what we have rather than hammering the
   * backend. Libraries that big should go through a dedicated "owned
   * book IDs" endpoint instead.
   *
   * Returns an empty Set on any failure so callers can safely render
   * the "not owned" UI without a try/catch.
   *
   * IMPORTANT: only call this when you've confirmed the user is
   * authenticated (see `getSessionLight`). Calling it for a guest
   * triggers the 401 → refresh path inside a Server Component, which
   * can't write cookies.
   */
  async ownedBookIds(): Promise<Set<string>> {
    const PAGE_SIZE = 100;
    const MAX_PAGES = 50;
    const ids = new Set<string>();

    try {
      const first = await this.listMyBooks({ page: 0, size: PAGE_SIZE });
      if (!first.ok) return ids;

      for (const b of first.data.content) ids.add(b.bookId);

      // `totalPages` is inclusive of page 0. Clamp to MAX_PAGES for safety.
      const totalPages = Math.min(first.data.totalPages, MAX_PAGES);

      // Fetch remaining pages in parallel — each is independent and the
      // backend enforces its own rate-limit. `Promise.allSettled` so one
      // failed page doesn't abort the rest; we just end up with a
      // slightly-undercounted Set, which is the safe direction (we'd
      // show "Buy" on an owned book, not ship a free book).
      if (totalPages > 1) {
        const rest = await Promise.allSettled(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            this.listMyBooks({ page: i + 1, size: PAGE_SIZE })
          )
        );
        for (const r of rest) {
          if (r.status === "fulfilled" && r.value.ok) {
            for (const b of r.value.data.content) ids.add(b.bookId);
          }
        }
      }

      return ids;
    } catch {
      return ids;
    }
  },
};
