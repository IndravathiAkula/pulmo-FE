import "server-only";

/**
 * Books service — three surfaces in one module:
 *
 *  1. Public reads     → listPublic, getPublic, listByCategory, listByAuthor
 *  2. Author own-books → listMine, getMine, create, update, remove, history
 *  3. Admin moderation → adminList, adminPending, adminGet, approve, reject, adminHistory
 *
 * Books created/updated by authors enter status `PENDING` and require admin
 * action before becoming public.
 *
 * Pagination convention:
 *  - `*List*()` methods return `BookResponse[]` (legacy unbounded mode).
 *  - `*List*Paged(query)` counterparts return `PagedResponse<BookResponse>`
 *    and forward `page` / `size` / `sort` to the backend.
 *  Split methods (not TS overloads) because object-literal methods can't
 *  be overloaded in TypeScript — and two explicit methods read more
 *  clearly at call sites than a union-returning one.
 */

import { apiClient } from "../api/apiClient";
import { BOOK_ROUTES, ADMIN_ROUTES, withQuery } from "../api/apiRoutes";
import type {
  ApiResult,
  BookResponse,
  BookApprovalLogResponse,
  CreateBookRequest,
  PagedQuery,
  PagedResponse,
  UpdateBookRequest,
  RejectBookRequest,
} from "../api/apiTypes";

function withPaging(base: string, query: PagedQuery): string {
  return withQuery(base, {
    page: query.page ?? 0,
    size: query.size ?? 20,
    sort: query.sort,
  });
}

export const booksService = {
  // ── Public ──────────────────────────────────────────────
  /** All published (status APPROVED) books — legacy unbounded array. */
  async listPublic(): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(BOOK_ROUTES.list, {
      method: "GET",
      skipAuth: true,
    });
  },

  /** Paged variant of {@link listPublic}. Sort: `createdAt|title|price|publishedDate`. */
  async listPublicPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(BOOK_ROUTES.list, query),
      { method: "GET", skipAuth: true }
    );
  },

  /** One published book — `404` if unpublished or missing. */
  async getPublic(id: string): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(BOOK_ROUTES.detail(id), {
      method: "GET",
      skipAuth: true,
    });
  },

  async listByCategory(
    categoryId: string
  ): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(BOOK_ROUTES.byCategory(categoryId), {
      method: "GET",
      skipAuth: true,
    });
  },

  async listByCategoryPaged(
    categoryId: string,
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(BOOK_ROUTES.byCategory(categoryId), query),
      { method: "GET", skipAuth: true }
    );
  },

  async listByAuthor(authorId: string): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(BOOK_ROUTES.byAuthor(authorId), {
      method: "GET",
      skipAuth: true,
    });
  },

  async listByAuthorPaged(
    authorId: string,
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(BOOK_ROUTES.byAuthor(authorId), query),
      { method: "GET", skipAuth: true }
    );
  },

  // ── Author own-books ────────────────────────────────────
  /** All books owned by the caller, regardless of status. */
  async listMine(): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(BOOK_ROUTES.myList, { method: "GET" });
  },

  async listMinePaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(BOOK_ROUTES.myList, query),
      { method: "GET" }
    );
  },

  async getMine(id: string): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(BOOK_ROUTES.myDetail(id), {
      method: "GET",
    });
  },

  /** New books always start as PENDING per spec. */
  async create(data: CreateBookRequest): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(BOOK_ROUTES.create, {
      method: "POST",
      body: data,
    });
  },

  /** Updating an own book resets it to PENDING (re-submission for review). */
  async update(
    id: string,
    data: UpdateBookRequest
  ): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(BOOK_ROUTES.update(id), {
      method: "PUT",
      body: data,
    });
  },

  /** Soft-delete own book. */
  async remove(id: string): Promise<ApiResult<null>> {
    return apiClient<null>(BOOK_ROUTES.remove(id), { method: "DELETE" });
  },

  /** Author-visible approval log for an own book. */
  async myHistory(
    id: string
  ): Promise<ApiResult<BookApprovalLogResponse[]>> {
    return apiClient<BookApprovalLogResponse[]>(BOOK_ROUTES.myHistory(id), {
      method: "GET",
    });
  },

  // ── Admin moderation ────────────────────────────────────
  /** All books, any status — admin queue. */
  async adminList(): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(ADMIN_ROUTES.booksList, {
      method: "GET",
    });
  },

  async adminListPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(ADMIN_ROUTES.booksList, query),
      { method: "GET" }
    );
  },

  /** Review queue — status PENDING only. */
  async adminPending(): Promise<ApiResult<BookResponse[]>> {
    return apiClient<BookResponse[]>(ADMIN_ROUTES.booksPending, {
      method: "GET",
    });
  },

  async adminPendingPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<BookResponse>>> {
    return apiClient<PagedResponse<BookResponse>>(
      withPaging(ADMIN_ROUTES.booksPending, query),
      { method: "GET" }
    );
  },

  async adminGet(id: string): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(ADMIN_ROUTES.bookDetail(id), {
      method: "GET",
    });
  },

  /** Status → APPROVED, isPublished → true. */
  async approve(id: string): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(ADMIN_ROUTES.bookApprove(id), {
      method: "PATCH",
    });
  },

  async reject(
    id: string,
    data: RejectBookRequest = {}
  ): Promise<ApiResult<BookResponse>> {
    return apiClient<BookResponse>(ADMIN_ROUTES.bookReject(id), {
      method: "PATCH",
      body: data,
    });
  },

  async adminHistory(
    id: string
  ): Promise<ApiResult<BookApprovalLogResponse[]>> {
    return apiClient<BookApprovalLogResponse[]>(
      ADMIN_ROUTES.bookHistory(id),
      { method: "GET" }
    );
  },
};
