"use client";

import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search title or topic…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface)] border border-[var(--color-border)]
          text-[var(--color-text-body)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20
          focus:border-[var(--color-primary)] transition-all"
            />
        </div>
    );
}
