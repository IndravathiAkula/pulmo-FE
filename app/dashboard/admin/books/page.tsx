import Link from "next/link";
import { BookOpen, ArrowRight, Inbox } from "lucide-react";
import { booksService } from "@/server/catalog/books.service";
import type { BookResponse, PagedResponse } from "@/server/api/apiTypes";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { BookStatusPill } from "@/features/books/components/BookStatusPill";
import { EmptyState } from "@/client/ui/feedback/EmptyState";
import {
  PaginationControls,
  parsePageParam,
} from "@/client/ui/PaginationControls";

type Tab = "all" | "pending";

const PAGE_SIZE = 20;

/**
 * Empty paged envelope used as the fail-open fallback when either list
 * request errors out. Keeps the tab rendering logic uniform.
 */
function emptyPage<T>(): PagedResponse<T> {
  return { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };
}

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab: rawTab, page: rawPage } = await searchParams;
  const tab: Tab = rawTab === "all" ? "all" : "pending";
  const page = parsePageParam(rawPage);

  // Fetch the current tab at full page size, and ask the OTHER tab for a
  // size-1 page just to read `totalElements` for the tab badge. Both
  // run in parallel so tab counts stay accurate with one extra cheap call.
  const [pendingResult, allResult] = await Promise.all([
    booksService.adminPendingPaged(
      tab === "pending"
        ? { page, size: PAGE_SIZE, sort: "createdAt,desc" }
        : { page: 0, size: 1 }
    ),
    booksService.adminListPaged(
      tab === "all"
        ? { page, size: PAGE_SIZE, sort: "createdAt,desc" }
        : { page: 0, size: 1 }
    ),
  ]);

  const pending: PagedResponse<BookResponse> = pendingResult.ok
    ? pendingResult.data
    : emptyPage<BookResponse>();
  const all: PagedResponse<BookResponse> = allResult.ok
    ? allResult.data
    : emptyPage<BookResponse>();

  const visible = tab === "pending" ? pending : all;

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Book Moderation
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Review and approve author submissions before they hit the public
          catalog.
        </p>
      </header>

      {/* Tabs — switching a tab resets to page 0 so the user doesn't
          land on an out-of-range page in the other list. */}
      <div className="flex items-center gap-1 mb-5 border-b border-[var(--color-border)]">
        <TabLink
          active={tab === "pending"}
          href="?tab=pending"
          count={pending.totalElements}
        >
          Pending
        </TabLink>
        <TabLink
          active={tab === "all"}
          href="?tab=all"
          count={all.totalElements}
        >
          All books
        </TabLink>
      </div>

      {visible.content.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "pending" ? "Inbox zero" : "No books yet"}
          description={
            tab === "pending"
              ? "All caught up — no books are currently waiting for review."
              : "Once authors submit books, they'll appear here for moderation."
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {visible.content.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </ul>

          <PaginationControls
            currentPage={visible.page}
            totalPages={visible.totalPages}
            totalElements={visible.totalElements}
            itemLabel={visible.totalElements === 1 ? "book" : "books"}
            ariaLabel="Book moderation pagination"
            buildHref={(p) => `/dashboard/admin/books?tab=${tab}&page=${p}`}
          />
        </>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2.5 -mb-px text-sm font-bold border-b-2 transition-colors ${
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
      }`}
    >
      {children}
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold ${
          active
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function BookRow({ book }: { book: BookResponse }) {
  return (
    <li>
      <Link
        href={`/dashboard/admin/books/${book.id}`}
        className="block rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
          <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0">
            {resolveFileUrl(book.coverUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveFileUrl(book.coverUrl)!}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-light)]">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[var(--color-text-main)] line-clamp-2 leading-snug">
                  {book.title}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  By <span className="font-semibold text-[var(--color-text-body)]">{book.authorName}</span>
                  <span className="mx-1.5 opacity-50">·</span>
                  <span className="font-semibold">{book.categoryName}</span>
                  {book.versionNumber && (
                    <>
                      <span className="mx-1.5 opacity-50">·</span>v
                      {book.versionNumber}
                    </>
                  )}
                </p>
              </div>
              <BookStatusPill status={book.status} />
            </div>

            {book.status === "REJECTED" && book.rejectionReason && (
              <p className="mt-2 text-xs text-[var(--color-error)] bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 line-clamp-2">
                <span className="font-bold">Reason:</span> {book.rejectionReason}
              </p>
            )}

            <div className="mt-auto pt-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold text-[var(--color-text-main)] tabular-nums">
                ${book.price.toFixed(2)}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
                Review
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
