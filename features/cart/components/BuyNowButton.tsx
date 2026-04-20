"use client";

/**
 * BuyNowButton — adds the book to the cart and routes the user to
 * /cart so they can review and check out.
 *
 * Why route to /cart instead of immediately checking out?
 *   - Keeps a single checkout funnel (the cart page is the only place
 *     that calls /cart/checkout)
 *   - Lets the user confirm the book + see existing cart contents
 *     before committing
 *   - Mirrors the standard ecommerce "Buy Now" pattern (Amazon, Shopify)
 *
 * Variants:
 *   - `primary` (default): solid orange CTA — paired next to AddToCartButton
 *     on detail pages
 *   - `compact`: small icon button — for dense BookCard layouts
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { useCart } from "@/client/cart/CartProvider";
import { useSession } from "@/client/auth/SessionProvider";
import { addToCartAction } from "@/features/cart/actions/cart.action";

interface BuyNowButtonProps {
  bookId: string;
  /**
   * - `primary` — solid orange CTA for detail pages
   * - `compact` — fixed 36×36 icon button
   * - `card`    — flex-1 icon + short label, paired with AddToCartButton in BookCard
   */
  variant?: "primary" | "compact" | "card";
  label?: string;
  className?: string;
}

export function BuyNowButton({
  bookId,
  variant = "primary",
  label = "Buy Now",
  className = "",
}: BuyNowButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { bump, refresh, hasItem, addItemLocally } = useCart();

  const [pending, startTransition] = useTransition();
  const [, setRouting] = useState(false);

  const handleClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?from=/cart`);
      return;
    }

    // Book already in cart → skip API, go straight to checkout.
    if (hasItem(bookId)) {
      setRouting(true);
      router.push("/cart");
      return;
    }

    startTransition(async () => {
      bump(1);

      const result = await addToCartAction(bookId);

      if (!result.success) {
        bump(-1);
        // Still navigate — book might be in the cart already (backend
        // idempotent) or the cart page will show the real state.
      } else {
        addItemLocally(bookId);
      }

      void refresh();
      setRouting(true);
      router.push("/cart");
    });
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Buy now"
        title="Buy now"
        className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-orange-light)] text-[var(--color-orange)] hover:bg-[var(--color-orange)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all ${className}`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Buy now"
        title="Buy now"
        className={`inline-flex flex-1 items-center justify-center gap-1.5 h-9 px-2 rounded-lg text-xs font-bold text-white bg-[var(--color-orange)] hover:bg-[var(--color-orange-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-all ${className}`}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Zap className="w-3.5 h-3.5" />
            {label === "Buy Now" ? "Buy" : label}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-orange)] hover:bg-[var(--color-orange-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}
