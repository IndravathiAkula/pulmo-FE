"use client";

/**
 * BookDetailActions — real-data CTA block on the book detail page.
 *
 * Three rendering modes:
 *   1. `isOwned`        → "Read now" + "View library" (no cart buttons)
 *   2. authenticated    → Add to Cart + Buy Now
 *   3. unauthenticated  → Add to Cart + Buy Now + sign-in nudge
 *
 * Renders the same `<BookPrice>` used on cards (consistent strike-through
 * + discount across surfaces). The `isOwned` flag is computed server-side
 * by the parent page (via `paymentsService.ownedBookIds`) so the initial
 * paint is correct — no client-side fetch flicker.
 */

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Library as LibraryIcon,
  Lock,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useSession } from "@/client/auth/SessionProvider";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { BuyNowButton } from "@/features/cart/components/BuyNowButton";
import { BookPrice } from "./BookPrice";

interface BookDetailActionsProps {
  bookId: string;
  price: number;
  discount?: number | null;
  /** True when the current user has already purchased this book. */
  isOwned?: boolean;
}

export function BookDetailActions({
  bookId,
  price,
  discount,
  isOwned = false,
}: BookDetailActionsProps) {
  const { isAuthenticated } = useSession();

  // ── Owned: read-now flow ─────────────────────────────────────
  if (isOwned) {
    return (
      <div className="glass-card p-5 space-y-4">
        {/* Owned banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-accent-light)] border border-[rgba(34,197,94,0.30)]">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[var(--color-accent-hover)] flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent-hover)]">
              You own this book
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-body)] mt-0.5">
              Open it in the secure reader anytime — your access never expires.
            </p>
          </div>
        </div>

        {/* Primary + secondary actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/reader/${bookId}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-full"
          >
            <BookOpen className="w-4 h-4" />
            Read now
          </Link>
          <Link
            href="/dashboard/library"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[var(--color-orange)] hover:bg-[var(--color-orange-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-full"
          >
            <LibraryIcon className="w-4 h-4" />
            View library
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex items-center gap-4 pt-2 text-xs text-[var(--color-text-muted)] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            DRM-protected reader
          </span>
        </div>
      </div>
    );
  }

  // ── Not owned: cart flow ─────────────────────────────────────
  return (
    <div className="glass-card p-5 space-y-4">
      {/* Price row */}
      <BookPrice price={price} discount={discount} size="lg" />

      {/* Auth hint */}
      {!isAuthenticated && (
        <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <Link
              href={`/login?from=/books/${bookId}`}
              className="font-bold text-[var(--color-primary)] hover:underline"
            >
              Sign in
            </Link>{" "}
            to add this book to your cart.
          </span>
        </div>
      )}

      {/* Actions — equal-width side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AddToCartButton bookId={bookId} className="w-full" />
        <BuyNowButton bookId={bookId} className="w-full" />
      </div>

      {/* Trust row */}
      <div className="flex items-center gap-4 pt-2 text-xs text-[var(--color-text-muted)] font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          Secure checkout
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShoppingCart className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          Instant library access
        </span>
      </div>
    </div>
  );
}
