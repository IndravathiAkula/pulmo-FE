import Link from "next/link";
import Image from "next/image";
import {
  Library as LibraryIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Receipt,
} from "lucide-react";
import { paymentsService } from "@/server/catalog/payments.service";
import type {
  PagedResponse,
  UserBookResponse,
} from "@/server/api/apiTypes";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { EmptyState } from "@/client/ui/feedback/EmptyState";

/**
 * /dashboard/library — purchased books for the current user.
 *
 * Wired to `GET /payments/my/books` (paged, default `accessGrantedAt,desc`).
 * Each card links to the public book detail page at `/books/[id]` — the
 * existing detail page detects ownership and exposes the "Read" CTA that
 * opens the SecureReader. We keep this page ownership-agnostic.
 *
 * Lives under /dashboard so the DashboardSidebar navigation persists.
 */

const PAGE_SIZE = 12;

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);

  const result = await paymentsService.listMyBooks({
    page,
    size: PAGE_SIZE,
    sort: "accessGrantedAt,desc",
  });

  // Fail-open: show an empty state rather than a crash if the backend
  // is unreachable. A 401 here means the user isn't logged in, which
  // middleware should have already redirected — belt-and-braces.
  const paged: PagedResponse<UserBookResponse> = result.ok
    ? result.data
    : { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  const isEmpty = paged.content.length === 0;
  const totalPages = Math.max(paged.totalPages, 1);
  const currentPage = paged.page; // zero-based

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Purchased Books
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {isEmpty
              ? "You haven't purchased any books yet."
              : `${paged.totalElements} ${paged.totalElements === 1 ? "book" : "books"} in your library`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          >
            <Receipt className="w-4 h-4" />
            Order history
          </Link> */}
          {/* Always show "Browse catalog" — users with a sparse library
              want a fast path to discover more titles. */}
          <Link
            href="/departments/all-departments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Browse catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={LibraryIcon}
          title="Your library is empty"
          description="Books you purchase will appear here with one-tap access to the secure reader."
          action={{
            label: "Browse catalog",
            href: "/departments/all-departments",
            icon: ArrowRight,
          }}
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paged.content.map((book) => (
              <LibraryBookCard key={book.bookId} book={book} />
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Library pagination"
              className="mt-8 flex items-center justify-between gap-4 flex-wrap"
            >
              <p className="text-xs text-[var(--color-text-muted)] font-semibold">
                Page <span className="font-black text-[var(--color-text-main)]">{currentPage + 1}</span> of{" "}
                <span className="font-black text-[var(--color-text-main)]">{totalPages}</span>
                <span className="mx-2">·</span>
                {paged.totalElements} total
              </p>
              <div className="flex items-center gap-2">
                <PageLink
                  disabled={currentPage <= 0}
                  page={currentPage - 1}
                  label="Previous"
                  icon="left"
                />
                <PageLink
                  disabled={currentPage + 1 >= totalPages}
                  page={currentPage + 1}
                  label="Next"
                  icon="right"
                />
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function LibraryBookCard({ book }: { book: UserBookResponse }) {
  const effectivePrice =
    book.pricePaid - (book.discount ?? 0);
  const cover = resolveFileUrl(book.coverUrl);

  return (
    <li className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-border-hover)] hover:shadow-md transition-all overflow-hidden">
      <Link
        href={`/books/${book.bookId}`}
        aria-label={`Open ${book.title}`}
        className="block relative aspect-[3/4] w-full max-w-[220px] mx-auto mt-4 overflow-hidden rounded-xl bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
      >
        {cover ? (
          <Image
            src={cover}
            alt={`Cover of ${book.title}`}
            width={220}
            height={293}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
            <BookOpen className="w-8 h-8" />
          </div>
        )}

        {/* Owned badge */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[rgba(34,197,94,0.30)]">
          Owned
        </span>
      </Link>

      <div className="flex-1 flex flex-col p-4 pt-3">
        <Link
          href={`/books/${book.bookId}`}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded"
        >
          <h3 className="text-sm font-extrabold text-[var(--color-text-main)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
          {book.authorName} · {book.categoryName}
        </p>

        {/* Progress bar (only if meaningful — > 0%) */}
        {book.progressPercentage > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <span>Progress</span>
              <span className="tabular-nums">{Math.round(book.progressPercentage)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${Math.min(book.progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(book.accessGrantedAt)}
          </span>
          <span className="font-bold text-[var(--color-text-body)] tabular-nums">
            ${effectivePrice.toFixed(2)}
          </span>
        </div>
      </div>
    </li>
  );
}

function PageLink({
  page,
  label,
  icon,
  disabled,
}: {
  page: number;
  label: string;
  icon: "left" | "right";
  disabled: boolean;
}) {
  const className = `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
    disabled
      ? "text-[var(--color-text-light)] bg-[var(--color-surface-alt)] border border-[var(--color-border)] cursor-not-allowed"
      : "text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
  }`;

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {icon === "left" && <ChevronLeft className="w-3.5 h-3.5" />}
        {label}
        {icon === "right" && <ChevronRight className="w-3.5 h-3.5" />}
      </span>
    );
  }

  return (
    <Link href={`/dashboard/library?page=${page}`} className={className}>
      {icon === "left" && <ChevronLeft className="w-3.5 h-3.5" />}
      {label}
      {icon === "right" && <ChevronRight className="w-3.5 h-3.5" />}
    </Link>
  );
}
