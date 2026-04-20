"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/client/cart/CartProvider";

/**
 * Cart icon for the navbar — pulls live count from CartProvider.
 * Renders a numeric badge when count > 0, capped at "9+" to avoid
 * the badge overflowing the icon.
 */
export function CartIconButton({
  className = "",
}: {
  className?: string;
}) {
  const { count } = useCart();
  const badge = count > 9 ? "9+" : count > 0 ? String(count) : null;

  return (
    <Link
      href="/cart"
      aria-label={
        count > 0 ? `Cart, ${count} items` : "Cart, empty"
      }
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--color-text-body)] hover:text-[var(--color-primary)] hover:bg-slate-50 transition-colors ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {badge && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-extrabold leading-none flex items-center justify-center ring-2 ring-white"
          aria-hidden="true"
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
