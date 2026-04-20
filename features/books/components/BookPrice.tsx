/**
 * BookPrice — shared price display.
 *
 *   No discount → "$X.XX"
 *   With discount → "$Y.YY"  with "$X.XX" struck through (smaller, muted)
 *                  + optional "Save $Z.ZZ" pill (large variant only)
 *
 * Sizes:
 *   sm — for cards and dense rows
 *   lg — for the book detail page
 */

interface BookPriceProps {
  price: number;
  discount?: number | null;
  size?: "sm" | "lg";
  /** Show "Save $X" pill next to the price (lg only). Defaults to true on lg. */
  showSaveBadge?: boolean;
  className?: string;
}

export function BookPrice({
  price,
  discount,
  size = "sm",
  showSaveBadge,
  className = "",
}: BookPriceProps) {
  const hasDiscount =
    discount !== undefined && discount !== null && discount > 0;
  const finalPrice = hasDiscount ? Math.max(0, price - (discount ?? 0)) : price;

  const showBadge = showSaveBadge ?? size === "lg";

  if (size === "lg") {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className="text-3xl font-black text-[var(--color-text-main)] tabular-nums">
          ${finalPrice.toFixed(2)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-sm text-[var(--color-text-muted)] line-through tabular-nums">
              ${price.toFixed(2)}
            </span>
            {showBadge && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ml-1"
                style={{
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-accent-hover)",
                  borderColor: "rgba(34, 197, 94, 0.30)",
                }}
              >
                Save ${(discount ?? 0).toFixed(2)}
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  // sm — for cards
  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="text-xl font-black text-[var(--color-text-main)] tabular-nums">
        ${finalPrice.toFixed(2)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-[var(--color-text-muted)] line-through tabular-nums">
          ${price.toFixed(2)}
        </span>
      )}
    </div>
  );
}
