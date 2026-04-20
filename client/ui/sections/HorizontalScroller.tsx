'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({
  title,
  subtitle,
  children
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  // Check whether the content overflows the container.
  // Re-checks on mount, resize, and whenever children change.
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 1); // +1 for sub-pixel rounding
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, children]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;

      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="group/section mb-12">
      <div className="flex items-end justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-black text-[var(--color-text-main)] tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--color-text-muted)] font-medium mt-1 uppercase tracking-widest">{subtitle}</p>}
        </div>

        {canScroll && (
          <div className="flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-border-hover)] transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-border-hover)] transition-all active:scale-90 shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 no-scrollbar snap-x scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {React.Children.map(children, (child) => (
          <div className="flex-shrink-0 w-[280px] md:w-[320px] snap-start">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
};
