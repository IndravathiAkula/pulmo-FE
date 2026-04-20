import "server-only";

/**
 * Categories service — wraps `/categories` and `/categories/admin/all` endpoints.
 *
 * Public reads (`list`, `detail`) work without auth; admin-only mutations
 * (`create`, `update`, `remove`, `toggle`, `adminList`) require ADMIN role.
 *
 * Caching strategy is the caller's responsibility — see API doc §12 for
 * recommended `revalidate` values per endpoint.
 */

import { apiClient } from "../api/apiClient";
import { CATEGORY_ROUTES, withQuery } from "../api/apiRoutes";
import type {
  ApiResult,
  CategoryResponse,
  CreateCategoryRequest,
  PagedQuery,
  PagedResponse,
  UpdateCategoryRequest,
} from "../api/apiTypes";

function withPaging(base: string, query: PagedQuery): string {
  return withQuery(base, {
    page: query.page ?? 0,
    size: query.size ?? 20,
    sort: query.sort,
  });
}

export const categoriesService = {
  // ── Public ──────────────────────────────────────────────
  async list(): Promise<ApiResult<CategoryResponse[]>> {
    return apiClient<CategoryResponse[]>(CATEGORY_ROUTES.list, {
      method: "GET",
      skipAuth: true,
    });
  },

  /** Paged variant of {@link list}. Sort: `name|createdAt`. */
  async listPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<CategoryResponse>>> {
    return apiClient<PagedResponse<CategoryResponse>>(
      withPaging(CATEGORY_ROUTES.list, query),
      { method: "GET", skipAuth: true }
    );
  },

  async detail(id: string): Promise<ApiResult<CategoryResponse>> {
    return apiClient<CategoryResponse>(CATEGORY_ROUTES.detail(id), {
      method: "GET",
      skipAuth: true,
    });
  },

  // ── Admin ───────────────────────────────────────────────
  async adminList(): Promise<ApiResult<CategoryResponse[]>> {
    return apiClient<CategoryResponse[]>(CATEGORY_ROUTES.adminList, {
      method: "GET",
    });
  },

  async adminListPaged(
    query: PagedQuery = {}
  ): Promise<ApiResult<PagedResponse<CategoryResponse>>> {
    return apiClient<PagedResponse<CategoryResponse>>(
      withPaging(CATEGORY_ROUTES.adminList, query),
      { method: "GET" }
    );
  },

  async create(
    data: CreateCategoryRequest
  ): Promise<ApiResult<CategoryResponse>> {
    return apiClient<CategoryResponse>(CATEGORY_ROUTES.create, {
      method: "POST",
      body: data,
    });
  },

  async update(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<ApiResult<CategoryResponse>> {
    return apiClient<CategoryResponse>(CATEGORY_ROUTES.update(id), {
      method: "PUT",
      body: data,
    });
  },

  async remove(id: string): Promise<ApiResult<null>> {
    return apiClient<null>(CATEGORY_ROUTES.remove(id), {
      method: "DELETE",
    });
  },

  /** Flips `active`. Backend returns the updated category. */
  async toggle(id: string): Promise<ApiResult<CategoryResponse>> {
    return apiClient<CategoryResponse>(CATEGORY_ROUTES.toggle(id), {
      method: "PATCH",
    });
  },
};
