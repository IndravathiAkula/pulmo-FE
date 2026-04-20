import "server-only";

/**
 * Authors service — public reads (`/authors`) + admin author CRUD (`/admin/authors*`).
 *
 * Author accounts are created BY admins (not via self-registration); the
 * `create` endpoint sends a verification email to the new author.
 */

import { apiClient } from "../api/apiClient";
import { AUTHOR_ROUTES, ADMIN_ROUTES, withQuery } from "../api/apiRoutes";
import type {
  ApiResult,
  AuthorResponse,
  CreateAuthorRequest,
  PagedQuery,
  PagedResponse,
  UpdateAuthorRequest,
} from "../api/apiTypes";

function withPaging(base: string, query: PagedQuery): string {
  return withQuery(base, {
    page: query.page ?? 0,
    size: query.size ?? 20,
    sort: query.sort,
  });
}

export const authorsService = {
  // ── Public ──────────────────────────────────────────────
  /** Active authors only — used by public author listings. */
  async listPublic(): Promise<ApiResult<AuthorResponse[]>> {
    return apiClient<AuthorResponse[]>(AUTHOR_ROUTES.list, {
      method: "GET",
      skipAuth: true,
    });
  },

  /** Paged variant of {@link listPublic}. Sort: `createdAt|firstName|lastName`. */
  async listPublicPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<AuthorResponse>>> {
    return apiClient<PagedResponse<AuthorResponse>>(
      withPaging(AUTHOR_ROUTES.list, query),
      { method: "GET", skipAuth: true }
    );
  },

  // ── Admin ───────────────────────────────────────────────
  async adminList(): Promise<ApiResult<AuthorResponse[]>> {
    return apiClient<AuthorResponse[]>(ADMIN_ROUTES.authorsList, {
      method: "GET",
    });
  },

  async adminListPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<AuthorResponse>>> {
    return apiClient<PagedResponse<AuthorResponse>>(
      withPaging(ADMIN_ROUTES.authorsList, query),
      { method: "GET" }
    );
  },

  async adminGet(id: string): Promise<ApiResult<AuthorResponse>> {
    return apiClient<AuthorResponse>(ADMIN_ROUTES.authorDetail(id), {
      method: "GET",
    });
  },

  /** Creates user + sends verification email to the new author. */
  async adminCreate(
    data: CreateAuthorRequest
  ): Promise<ApiResult<AuthorResponse>> {
    return apiClient<AuthorResponse>(ADMIN_ROUTES.authorCreate, {
      method: "POST",
      body: data,
    });
  },

  async adminUpdate(
    id: string,
    data: UpdateAuthorRequest
  ): Promise<ApiResult<AuthorResponse>> {
    return apiClient<AuthorResponse>(ADMIN_ROUTES.authorUpdate(id), {
      method: "PUT",
      body: data,
    });
  },

  /** Soft-deactivate (per spec). */
  async adminDelete(id: string): Promise<ApiResult<null>> {
    return apiClient<null>(ADMIN_ROUTES.authorDelete(id), {
      method: "DELETE",
    });
  },

  /** Flip active flag. */
  async adminToggle(id: string): Promise<ApiResult<AuthorResponse>> {
    return apiClient<AuthorResponse>(ADMIN_ROUTES.authorToggle(id), {
      method: "PATCH",
    });
  },

  async adminResendVerification(id: string): Promise<ApiResult<null>> {
    return apiClient<null>(ADMIN_ROUTES.authorResendVerification(id), {
      method: "POST",
    });
  },
};
