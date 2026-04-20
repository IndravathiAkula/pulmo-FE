import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Pencil,
  History,
  ArrowRight,
} from "lucide-react";
import { booksService } from "@/server/catalog/books.service";
import type { BookResponse, PagedResponse } from "@/server/api/apiTypes";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { BookStatusPill } from "@/features/books/components/BookStatusPill";
import { DeleteBookButton } from "@/features/books/components/DeleteBookButton";
import { EmptyState } from "@/client/ui/feedback/EmptyState";
import {
  PaginationControls,
  parsePageParam,
} from "@/client/ui/PaginationControls";

const PAGE_SIZE = 12;

export default async function MyBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePageParam(rawPage);

  const result = await booksService.listMinePaged({
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  // Fail-open: show an empty state rather than a crash if the backend
  // is unreachable. The 401 path is already handled by the interceptor.
  const paged: PagedResponse<BookResponse> = result.ok
    ? result.data
    : { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  // Hide soft-deleted from the default list — author can't act on them.
  // (Server-side filtering would be cleaner but the backend doesn't expose
  // a status filter on /books/my; tolerating a slight under-count on the
  // current page is acceptable.) Cover URLs are resolved to absolute so
  // Image tags render against the backend origin.
  const visible: BookResponse[] = paged.content
    .filter((b) => b.status !== "DELETED")
    .map((b) => ({
      ...b,
      coverUrl: resolveFileUrl(b.coverUrl) ?? b.coverUrl,
    }));

  const isEmpty = paged.totalElements === 0;

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            My Books
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {isEmpty
              ? "You haven't submitted any books yet."
              : `${paged.totalElements} ${paged.totalElements === 1 ? "book" : "books"}`}
          </p>
        </div>

        <Link
          href="/dashboard/books/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Add Book
        </Link>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Submit your first book — once an admin approves it, it'll appear in the public catalog."
          action={{
            label: "Create your first book",
            href: "/dashboard/books/new",
            icon: ArrowRight,
          }}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {visible.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </ul>

          <PaginationControls
            currentPage={paged.page}
            totalPages={paged.totalPages}
            totalElements={paged.totalElements}
            itemLabel={paged.totalElements === 1 ? "book" : "books"}
            ariaLabel="My books pagination"
            buildHref={(p) => `/dashboard/books?page=${p}`}
          />
        </>
      )}
    </div>
  );
}

function BookRow({ book }: { book: BookResponse }) {
  return (
    <li className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-border-hover)] hover:shadow-md transition-all overflow-hidden">
      <div className="relative flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Whole-card link to details. Sits behind the action buttons
            so those stay clickable (they get `relative z-10` below). */}
        <Link
          href={`/dashboard/books/${book.id}`}
          aria-label={`View details for ${book.title}`}
          className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
        />

        {/* Cover */}
        <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0 pointer-events-none">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-light)]">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col pointer-events-none">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[var(--color-text-main)] line-clamp-2 leading-snug">
                {book.title}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                <span className="font-semibold">{book.categoryName}</span>
                {book.versionNumber && (
                  <>
                    <span className="mx-1.5 opacity-50">·</span>v
                    {book.versionNumber}
                  </>
                )}
                {book.pages && (
                  <>
                    <span className="mx-1.5 opacity-50">·</span>
                    {book.pages} pages
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
              {book.discount && book.discount > 0 && (
                <span className="ml-2 text-xs font-semibold text-[var(--color-text-muted)] line-through">
                  ${(book.price + book.discount).toFixed(2)}
                </span>
              )}
            </p>

            <div className="relative z-10 pointer-events-auto flex items-center gap-2">
              <Link
                href={`/dashboard/books/${book.id}/history`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-body)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Link>
              <Link
                href={`/dashboard/books/${book.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
              <DeleteBookButton
                bookId={book.id}
                bookTitle={book.title}
                variant="compact"
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

