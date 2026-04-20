"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import type { Book } from '@/app/data/books';
import { BookPrice } from './BookPrice';
import { Card } from '@/client/ui/Card';
import { AddToCartButton } from '@/features/cart/components/AddToCartButton';
import { BuyNowButton } from '@/features/cart/components/BuyNowButton';
import { useOwnedBooks } from '@/client/owned-books/OwnedBooksProvider';

interface BookCardProps {
  book: Book;
}

/**
 * BookCard — catalog tile.
 *
 * Ownership-aware: when the user owns this book, the card shows an
 * "Owned" badge + a "Read" CTA (links to `/reader/{id}`) instead of
 * the cart buttons. Ownership is read from the global
 * <OwnedBooksProvider> context, which fetches on mount and after
 * checkout so the swap is near-instant.
 */
export function BookCard({ book }: BookCardProps) {
  const detailHref = `/books/${book.id}`;
  const showRating = book.rating > 0;
  const { owns, loading: ownershipLoading } = useOwnedBooks();
  const isOwned = owns(book.id);

  return (
    <Card className="group flex flex-col h-full bg-transparent overflow-hidden px-4 py-4 hover:border-[var(--color-primary)]/30 transition-all duration-300">
      {/* Cover (clickable).
          max-w cap keeps the cover at a sensible book-shelf size even
          when the card itself is wide (e.g. single-column mobile or
          3-column desktop) — without it the 3:4 aspect renders a
          very tall image. */}
      <Link
        href={detailHref}
        aria-label={`Open ${book.title}`}
        className="block relative aspect-[1] w-full max-w-[400px] mx-auto overflow-hidden rounded-xl mb-5 bg-white shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
      >
        <Image
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          width={200}
          height={350}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          unoptimized
        />

        {/* Hover tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Ownership badge */}
        <div className="absolute top-3 right-3 z-10">
          {isOwned ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-green-50 border border-green-200 text-[var(--color-accent-hover)]">
              <CheckCircle2 className="w-3 h-3" />
              Owned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-white/90 border border-[var(--color-border)] text-[var(--color-text-body)]">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1">
        <Link
          href={detailHref}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded"
        >
          <h3 className="font-bold text-[var(--color-text-main)] text-lg line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors mb-1 leading-tight tracking-tight">
            {book.title}
          </h3>
        </Link>

        {showRating && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 font-black text-[10px] uppercase tracking-tighter">
              <Star className="h-3 w-3 fill-current" />
              {book.rating.toFixed(1)}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
              ({book.reviewCount} reviews)
            </span>
          </div>
        )}

        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-5 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          {book.description}
        </p>

        {/* Footer: price + actions, pinned to the bottom */}
        <div className="mt-auto space-y-3 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-widest">
              <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)] opacity-60" />
              <span>{book.pageCount > 0 ? `${book.pageCount} Pages` : '—'}</span>
            </div>
            <BookPrice
              price={book.price}
              discount={book.discount}
              size="sm"
            />
          </div>

          {/* Action row — swaps between Read CTA and cart buttons
              based on ownership from OwnedBooksProvider. While the
              ownership check is loading, buttons are disabled to
              prevent the user from clicking cart buttons for a book
              they actually own. */}
          {isOwned ? (
            <Link
              href={`/reader/${book.id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Read
            </Link>
          ) : (
            <div className={`flex items-center gap-2 ${ownershipLoading ? "opacity-50 pointer-events-none" : ""}`}>
              <AddToCartButton bookId={book.id} variant="card" />
              <BuyNowButton bookId={book.id} variant="card" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
