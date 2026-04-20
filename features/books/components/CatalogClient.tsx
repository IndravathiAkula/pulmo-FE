"use client";

import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Book } from '@/app/data/books';
import { BookCard } from './BookCard';
import { BookGrid } from './BookGrid';
import { SearchBar } from './SearchBar';
import { CategoryChips } from './CategoryChips';
import { EmptyState } from '@/client/ui/feedback/EmptyState';

interface CatalogClientProps {
    books: Book[];
    categories: string[];
}

export function CatalogClient({ books, categories }: CatalogClientProps) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filtered = books.filter((b) => {
        const q = search.toLowerCase();
        const matchesSearch =
            q === '' ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.tags.some((t) => t.toLowerCase().includes(q));
        const matchesCategory = activeCategory === null || b.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SearchBar value={search} onChange={setSearch} />
                {/* <CategoryChips categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} /> */}
            </div>

            {filtered.length > 0 ? (
                <div className="animate-fade-in">
                    <BookGrid>
                        {filtered.map((book) => (
                            <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${parseInt(book.id) * 60}ms` }}>
                                <BookCard book={book} />
                            </div>
                        ))}
                    </BookGrid>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <EmptyState
                        icon={BookOpen}
                        title="No books match your search"
                        description={
                            search || activeCategory
                                ? "Try a different keyword or clear the filters to see the full catalog."
                                : "There are no books in the catalog yet — check back soon."
                        }
                        action={
                            search || activeCategory
                                ? {
                                      label: "Clear filters",
                                      onClick: () => {
                                          setSearch('');
                                          setActiveCategory(null);
                                      },
                                      icon: X,
                                  }
                                : undefined
                        }
                    />
                </div>
            )}
        </>
    );
}
