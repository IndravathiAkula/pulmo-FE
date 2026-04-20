"use client";

/**
 * AddToCartButton — drop-in CTA for any book surface.
 *
 * Wires into the global CartProvider so the navbar badge bumps
 * optimistically on click and reconciles via /api/cart/count after
 * the server action returns.
 *
 * Variants:
 *  - `primary` (default): solid navy CTA — use on detail pages.
 *  - `compact`: small icon button — use inside dense card layouts.
 *
 * Usage:
 *   <AddToCartButton bookId={book.id} />
 *   <AddToCartButton bookId={book.id} variant="compact" />
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useCart } from "@/client/cart/CartProvider";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { useSession } from "@/client/auth/SessionProvider";
import { addToCartAction } from "@/features/cart/actions/cart.action";

interface AddToCartButtonProps {
  bookId: string;
  /**
   * - `primary` — solid CTA for detail pages
   * - `compact` — fixed 36×36 icon button (toolbars, dense rows)
   * - `card`    — flex-1 icon + short label, paired with BuyNowButton in BookCard
   */
  variant?: "primary" | "compact" | "card";
  /** Override the default label on primary/card variants. */
  label?: string;
  className?: string;
}

export function AddToCartButton({
  bookId,
  variant = "primary",
  label = "Add to Cart",
  className = "",
}: AddToCartButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { bump, refresh, hasItem, addItemLocally } = useCart();
  const toast = useToast();

  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  const alreadyInCart = hasItem(bookId);

  const handleClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?from=/cart`);
      return;
    }

    // Skip the API call entirely if we already know the book is in the cart.
    if (alreadyInCart) {
      toast.info("Already in your cart");
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
      return;
    }

    startTransition(async () => {
      bump(1);

      const result = await addToCartAction(bookId);

      if (!result.success) {
        bump(-1);
        toast.error(result.message || "Could not add to cart");
        return;
      }

      toast.success(result.message || "Added to cart");
      setJustAdded(true);
      addItemLocally(bookId);
      void refresh();

      setTimeout(() => setJustAdded(false), 1800);
    });
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Add to cart"
        className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all ${className}`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : justAdded ? (
          <Check className="w-4 h-4" />
        ) : (
          <ShoppingCart className="w-4 h-4" />
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
        aria-label="Add to cart"
        title="Add to cart"
        // className={`inline-flex flex-1 items-center justify-center gap-1.5 h-9 px-2 rounded-lg text-xs font-bold bg-[var(--color-primary-primary)] text-[var(--color-light)] hover:bg-[var(--color-light)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed transition-all ${className}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 h-9 px-2 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : justAdded ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" />
            {label === "Add to Cart" ? "Cart" : label}
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
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Adding…
        </>
      ) : justAdded ? (
        <>
          <Check className="w-4 h-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}
