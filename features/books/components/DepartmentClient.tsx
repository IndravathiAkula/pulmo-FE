'use client';

import React, { useState } from 'react';
import type { Book } from '@/app/data/books';
import { BookCard } from './BookCard';
import { BookGrid } from './BookGrid';
import { SearchBar } from './SearchBar';
import { BookOpen, X } from 'lucide-react';
import { EmptyState } from '@/client/ui/feedback/EmptyState';

interface DepartmentClientProps {
  initialCategory: string | null;
  categories: string[];
  /** Pre-fetched books (real or mock) — already in the legacy Book shape. */
  books: Book[];
}

export const DepartmentClient: React.FC<DepartmentClientProps> = ({
  initialCategory,
  books,
}) => {
  const [search, setSearch] = useState('');

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      q === '' ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q));
    const matchesCategory = initialCategory === null || b.category === initialCategory;
    return matchesSearch && matchesCategory;
  });

  const title = initialCategory || 'All Study Materials';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
              {title}
            </h1>
            {initialCategory && (
              <span className="inline-block text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-3 py-1 rounded-full uppercase tracking-wider">
                {initialCategory}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {filtered.length} study resource{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      {/* Book Grid */}
      {filtered.length > 0 ? (
        <BookGrid>
          {filtered.map((book, idx) => (
            // Animation delay is index-based so it works for both
            // numeric mock ids and UUID-style real ids.
            <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <BookCard book={book} />
            </div>
          ))}
        </BookGrid>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={search ? "No study materials match your search" : "No study materials yet"}
          description={
            search
              ? "Try a different keyword, or clear the search to see the full catalog."
              : "New Materials are added regularly — check back soon."
          }
          action={
            search
              ? { label: "Clear search", onClick: () => setSearch(''), icon: X }
              : undefined
          }
        />
      )}
    </div>
  );
};
