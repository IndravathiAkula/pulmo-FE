"use client";

interface CategoryChipsProps {
    categories: string[];
    activeCategory: string | null;
    onChange: (cat: string | null) => void;
}

export function CategoryChips({ categories, activeCategory, onChange }: CategoryChipsProps) {
    return (
        <div className="flex gap-2 flex-wrap">
            <button
                onClick={() => onChange(null)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${!activeCategory
                    ? 'bg-[var(--color-primary)] text-[var(--color-text-main)]'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
                    }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onChange(activeCategory === cat ? null : cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat
                        ? 'bg-[var(--color-primary)] text-[var(--color-text-main)]'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
