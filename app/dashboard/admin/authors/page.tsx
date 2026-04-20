import { authorsService } from "@/server/catalog/authors.service";
import type { AuthorResponse, PagedResponse } from "@/server/api/apiTypes";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { AdminAuthorsClient } from "@/features/admin/components/AdminAuthorsClient";
import {
  PaginationControls,
  parsePageParam,
} from "@/client/ui/PaginationControls";

const PAGE_SIZE = 20;

export default async function AdminAuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePageParam(rawPage);

  const result = await authorsService.adminListPaged({
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  // Fail-open on backend error so the page renders an empty state instead
  // of a crash. Relative profileUrl paths are resolved to absolute URLs
  // so AuthorRow avatars and the edit-modal FileUpload preview work.
  const paged: PagedResponse<AuthorResponse> = result.ok
    ? {
        ...result.data,
        content: result.data.content.map((a) => ({
          ...a,
          profileUrl: resolveFileUrl(a.profileUrl) ?? a.profileUrl,
        })),
      }
    : { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  // Per-page aggregates are best we can do without an extra backend call.
  // Drops the cross-page "X unverified" banner the legacy implementation
  // computed client-side — acceptable trade-off for now.
  const pageActiveCount = paged.content.filter((a) => a.active).length;
  const pageUnverifiedCount = paged.content.filter((a) => !a.emailVerified).length;

  return (
    <div className="max-w-5xl">
      <header className="mb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Authors
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {paged.totalElements === 0
            ? "No authors invited yet."
            : `${paged.totalElements} ${paged.totalElements === 1 ? "author" : "authors"} · ${pageActiveCount} active on this page`}
          {pageUnverifiedCount > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-[var(--color-peach-deep)]">
                {pageUnverifiedCount} unverified on this page
              </span>
            </>
          )}
        </p>
      </header>

      <AdminAuthorsClient authors={paged.content} />

      <PaginationControls
        currentPage={paged.page}
        totalPages={paged.totalPages}
        totalElements={paged.totalElements}
        itemLabel={paged.totalElements === 1 ? "author" : "authors"}
        ariaLabel="Authors pagination"
        buildHref={(p) => `/dashboard/admin/authors?page=${p}`}
      />
    </div>
  );
}
