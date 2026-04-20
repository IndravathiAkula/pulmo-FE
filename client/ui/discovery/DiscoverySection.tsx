import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface DiscoverySectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Destination for the "View All" CTA. The link is rendered ONLY when
   * this prop is provided AND the caller-reported `itemCount` meets the
   * `viewAllMinItems` threshold (default 5). This prevents the button
   * from showing next to an empty carousel or a carousel that already
   * shows everything the catalog has.
   */
  viewAllHref?: string;
  viewAllLabel?: string;
  /**
   * Number of items actually rendered inside `children`. When omitted,
   * the "View All" link falls back to the legacy always-shown behaviour
   * (kept for backwards compatibility — new call sites should pass it).
   */
  itemCount?: number;
  /**
   * Hide the "View All" link when `itemCount < viewAllMinItems`. Default
   * 5 — below that, the carousel already shows every item in view and
   * the link would be redundant. Set to 1 to show the link whenever the
   * section isn't completely empty.
   */
  viewAllMinItems?: number;
  className?: string;
}

export const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  title,
  subtitle,
  children,
  viewAllHref,
  viewAllLabel = 'View All',
  itemCount,
  viewAllMinItems = 5,
  className = '',
}) => {
  const showViewAll =
    !!viewAllHref &&
    (itemCount === undefined || itemCount >= viewAllMinItems);

  return (
    <section className={`mb-16 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 px-1">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] tracking-tight mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-muted)] max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {showViewAll && (
          <Link
            href={viewAllHref!}
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors group whitespace-nowrap"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
};
