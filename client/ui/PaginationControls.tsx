import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * PaginationControls — shared "Page X of Y · Prev / Next" nav for any
 * page that consumes a `PagedResponse<T>` from the backend.
 *
 * The caller owns the URL shape: it passes a `buildHref(page)` function
 * so the component can preserve other search params (tab, filters, etc.)
 * that differ per page. Keeps the component presentation-only — no
 * knowledge of route paths or query-string schemas.
 */

interface PaginationControlsProps {
  /** Zero-based current page (matches the backend's `page` field). */
  currentPage: number;
  /** Backend's `totalPages`. Component hides itself when ≤ 1. */
  totalPages: number;
  /** Backend's `totalElements` — shown in the summary. */
  totalElements: number;
  /** Produces the href for a given zero-based page index. */
  buildHref: (page: number) => string;
  /** Noun shown in the summary, e.g. "books" / "authors". Defaults to "items". */
  itemLabel?: string;
  /** Aria-label on the nav — defaults to "Pagination". */
  ariaLabel?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalElements,
  buildHref,
  itemLabel = "items",
  ariaLabel = "Pagination",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 0;
  const nextDisabled = currentPage + 1 >= totalPages;

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-8 flex items-center justify-between gap-4 flex-wrap"
    >
      <p className="text-xs text-[var(--color-text-muted)] font-semibold">
        Page{" "}
        <span className="font-black text-[var(--color-text-main)]">
          {currentPage + 1}
        </span>{" "}
        of{" "}
        <span className="font-black text-[var(--color-text-main)]">
          {totalPages}
        </span>
        <span className="mx-2">·</span>
        {totalElements} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <PageLink
          href={buildHref(currentPage - 1)}
          disabled={prevDisabled}
          label="Previous"
          icon="left"
        />
        <PageLink
          href={buildHref(currentPage + 1)}
          disabled={nextDisabled}
          label="Next"
          icon="right"
        />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  label,
  icon,
  disabled,
}: {
  href: string;
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
    <Link href={href} className={className}>
      {icon === "left" && <ChevronLeft className="w-3.5 h-3.5" />}
      {label}
      {icon === "right" && <ChevronRight className="w-3.5 h-3.5" />}
    </Link>
  );
}

/**
 * Helper — parse `?page=` from a search-param string. Returns 0 for
 * missing / non-numeric / negative values. Saves every page from
 * re-implementing the same three-line parser.
 */
export function parsePageParam(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
