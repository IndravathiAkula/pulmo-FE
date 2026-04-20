import React from 'react';
import { Filter, Star, Tag, ChevronRight } from 'lucide-react';

interface FilterSidebarProps {
  categories: string[];
  doctors: string[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  minRating,
  onRatingChange,
}) => {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8 animate-in slide-in-from-left duration-500">
      <div>
        <div className="flex items-center gap-2 mb-6 text-[var(--color-primary)]">
          <Filter className="h-5 w-5" />
          <h3 className="font-bold uppercase tracking-widest text-xs">Filter Resources</h3>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-[var(--color-text-main)] flex items-center gap-2">
            <Tag className="h-4 w-4 opacity-40" />
            Specialties
          </h4>
          <div className="space-y-1.5 ml-1">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between group
                ${activeCategory === null ? 'bg-[var(--color-primary)] text-white font-bold shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text-main)]'}
              `}
            >
              All Departments
              <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === null ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between group
                  ${activeCategory === cat ? 'bg-[var(--color-primary)] text-white font-bold shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text-main)]'}
                `}
              >
                {cat}
                <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === cat ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ratings Filter */}
      <div className="pt-8 border-t border-[var(--color-border)]">
        <h4 className="font-bold text-sm text-[var(--color-text-main)] flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 opacity-40" />
          Minimum Rating
        </h4>
        <div className="space-y-3 px-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="min-rating"
              checked={minRating === null}
              onChange={() => onRatingChange(null)}
              className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
            />
            <span className="text-xs text-[var(--color-text-muted)] font-medium group-hover:text-[var(--color-text-main)]">
              Any Rating
            </span>
          </label>
          {[4, 3, 2].map((rating) => (
            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="min-rating"
                checked={minRating === rating}
                onChange={() => onRatingChange(rating)}
                className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
              />
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-current' : 'opacity-20'}`} />
                ))}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium group-hover:text-[var(--color-text-main)]">
                & Up
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};
