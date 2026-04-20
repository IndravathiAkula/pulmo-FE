import { categoriesService } from "@/server/catalog/categories.service";
import type { CategoryResponse, PagedResponse } from "@/server/api/apiTypes";
import { AdminCategoriesClient } from "@/features/admin/components/AdminCategoriesClient";
import {
  PaginationControls,
  parsePageParam,
} from "@/client/ui/PaginationControls";

const PAGE_SIZE = 20;

/**
 * Categories list. Uses `adminListPaged` (not the public list) so admins
 * see inactive categories too — the public list filters them out.
 *
 * Create / edit happen in modals (see AdminCategoriesClient).
 */
export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePageParam(rawPage);

  const result = await categoriesService.adminListPaged({
    page,
    size: PAGE_SIZE,
    sort: "name,asc",
  });

  const paged: PagedResponse<CategoryResponse> = result.ok
    ? result.data
    : { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  const pageActiveCount = paged.content.filter((c) => c.active).length;

  return (
    <div className="max-w-4xl">
      <header className="mb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Categories
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {paged.totalElements === 0
            ? "No categories yet — add the first one to get started."
            : `${paged.totalElements} ${paged.totalElements === 1 ? "category" : "categories"} · ${pageActiveCount} active on this page`}
        </p>
      </header>

      <AdminCategoriesClient categories={paged.content} />

      <PaginationControls
        currentPage={paged.page}
        totalPages={paged.totalPages}
        totalElements={paged.totalElements}
        itemLabel={paged.totalElements === 1 ? "category" : "categories"}
        ariaLabel="Categories pagination"
        buildHref={(p) => `/dashboard/admin/categories?page=${p}`}
      />
    </div>
  );
}
