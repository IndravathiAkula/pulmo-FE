"use client";

import { useEffect, useState } from 'react';
import { useRecentBooksStore } from '@/client/state/useRecentBooksStore';
import { BookCard } from '@/features/books/components/BookCard';
import { HorizontalScroller } from '@/client/ui/sections/HorizontalScroller';
import { DiscoverySection } from '@/client/ui/discovery/DiscoverySection';
import { books } from '@/app/data/books';

/**
 * Client component for the "Continue Researching" section.
 * Reads from Zustand (localStorage) store to render personalized history.
 * Hidden entirely when there is no history, avoiding hydration mismatches
 * by deferring rendering until after mount.
 */
export function RecentlyViewedSection() {
  const recentBooks = useRecentBooksStore((s) => s.recentBooks);
  // Avoid hydration mismatch: only render on the client after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || recentBooks.length === 0) return null;

  // Resolve full book objects from the store data to reuse BookCard as-is
  const resolvedBooks = recentBooks
    .map((r) => books.find((b) => b.id === r.id))
    .filter(Boolean) as typeof books;

  return (
    <DiscoverySection
      title="Continue Reading"
      subtitle="Pick up where you left off with your recently accessed medical journals."
    >
      <HorizontalScroller title="Recently Viewed">
        {resolvedBooks.map((book) => (
          <BookCard key={`recent-${book.id}`} book={book} />
        ))}
      </HorizontalScroller>
    </DiscoverySection>
  );
}
