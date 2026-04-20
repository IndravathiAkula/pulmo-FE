/**
 * EmptyState — shared empty/no-data screen used across the app.
 *
 * Consolidates the gradient-card + icon-in-white-tile + title + description
 * + optional CTA pattern that was previously re-implemented in every feature
 * (cart, my-books, admin authors/categories/books, etc.). Using a single
 * component keeps spacing, typography, icon treatment, and theming coherent.
 *
 * Tones:
 *   default — large gradient card for top-level "you have nothing yet"
 *             screens (cart empty, no authors, no categories, no books).
 *   inline  — compact plain-white card for "no results" states inside a
 *             larger page (search with no matches, empty approval history).
 *
 * Usage:
 *   <EmptyState
 *     icon={ShoppingBag}
 *     title="Your cart is empty"
 *     description="Browse the catalog to find books worth adding."
 *     action={{ label: "Browse books", href: "/departments/all-departments", icon: ArrowRight }}
 *   />
 */

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateTone = "default" | "inline";

interface EmptyStateAction {
  label: string;
  /** Internal route — renders a <Link>. Mutually exclusive with `onClick`. */
  href?: string;
  /** Client handler — renders a <button>. Mutually exclusive with `href`. */
  onClick?: () => void;
  /** Optional lucide icon rendered left of the label. */
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: EmptyStateAction;
  /** Optional secondary action rendered next to the primary one. */
  secondaryAction?: EmptyStateAction;
  /** "default" for page-level, "inline" for subsection-level. */
  tone?: EmptyStateTone;
  className?: string;
}

const THEME_GRADIENT =
  "linear-gradient(135deg, #FFF8F0 0%, #FFECD2 25%, #FCE4D4 50%, #F0E6F0 75%, #E8EFF8 100%)";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  tone = "default",
  className = "",
}: EmptyStateProps) {
  const isDefault = tone === "default";

  return (
    <section
      className={`rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div
        className={
          isDefault
            ? "px-6 py-16 sm:py-20 flex flex-col items-center text-center"
            : "px-6 py-12 flex flex-col items-center text-center"
        }
        style={isDefault ? { background: THEME_GRADIENT } : undefined}
      >
        <div
          className={
            isDefault
              ? "w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5"
              : "w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mb-4"
          }
        >
          <Icon
            className={
              isDefault
                ? "w-7 h-7 text-[var(--color-primary)]"
                : "w-6 h-6 text-[var(--color-primary)]"
            }
          />
        </div>

        <h2 className="text-xl font-extrabold text-[var(--color-text-main)] tracking-tight mb-2">
          {title}
        </h2>

        {description && (
          <div className="text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
            {description}
          </div>
        )}

        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {action && <ActionElement action={action} variant="primary" />}
            {secondaryAction && (
              <ActionElement action={secondaryAction} variant="secondary" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ActionElement({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "primary" | "secondary";
}) {
  const ActionIcon = action.icon;
  const className =
    variant === "primary"
      ? "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
      : "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] transition-colors";

  const body = (
    <>
      {ActionIcon && <ActionIcon className="w-4 h-4" />}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {body}
    </button>
  );
}
