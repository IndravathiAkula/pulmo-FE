'use client';

import React from 'react';
import Image from 'next/image';
import { Star, BookOpen, ChevronRight } from 'lucide-react';
import { Card } from '../Card';
import { Badge } from '../Badge';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    rating: number;
    reviewCount: number;
    category: string;
    tags?: string[];
  };
  onClick?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="group flex flex-col h-full overflow-hidden bg-white"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-[var(--color-surface-alt)]">
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Badge className="bg-[var(--color-primary)] text-white border-none shadow-lg">
            Quick View
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 backdrop-blur-sm border border-[var(--color-border)] text-[var(--color-text-body)] font-bold">
            {book.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-1">
        <h3 className="font-bold text-[var(--color-text-main)] text-lg line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors mb-1 leading-tight">
          {book.title}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-3 inline-flex items-center gap-1">
          By <span className="font-medium text-[var(--color-text-body)]">{book.author}</span>
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold text-xs">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-bold">{book.rating}</span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">({book.reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-widest">
            <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)] opacity-70" />
            <span>Resource</span>
          </div>
          <button className="text-[var(--color-primary)] p-1.5 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  );
};
