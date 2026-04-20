"use client";

/**
 * Single line item in the cart — handles its own "Remove" action so
 * the parent /cart page can stay a Server Component and re-render
 * after the action via revalidateTag('cart').
 */

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import type { CartItemResponse } from "@/server/api/apiTypes";
import { useCart } from "@/client/cart/CartProvider";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { removeFromCartAction } from "@/features/cart/actions/cart.action";

export function CartItemRow({ item }: { item: CartItemResponse }) {
  const { bump, refresh } = useCart();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      bump(-1);
      const result = await removeFromCartAction(item.bookId);

      if (!result.success) {
        bump(1);
        toast.error(result.message || "Could not remove item");
        return;
      }

      toast.success("Removed from cart");
      void refresh();
    });
  };

  const hasDiscount =
    item.discount !== null && item.discount !== undefined && item.discount > 0;

  return (
    <li className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors">
      {/* Cover */}
      <Link
        href={`/books/${item.bookId}`}
        className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0"
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-light)]">
            No cover
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1">
          <Link
            href={`/books/${item.bookId}`}
            className="text-base font-extrabold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
            By <span className="font-semibold text-[var(--color-text-body)]">{item.authorName}</span>
            <span className="mx-1.5 opacity-50">·</span>
            <span className="font-medium">{item.categoryName}</span>
          </p>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[var(--color-text-main)] tabular-nums">
              ${item.effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[var(--color-text-muted)] line-through tabular-nums">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--color-error)] hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={`Remove ${item.title} from cart`}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
