"use client";

/**
 * CartActions — Clear + Checkout buttons for the /cart summary card.
 * Both call server actions and reconcile the navbar badge through the
 * shared CartProvider.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "@/client/cart/CartProvider";
import { useOwnedBooks } from "@/client/owned-books/OwnedBooksProvider";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";
import {
  clearCartAction,
  checkoutAction,
} from "@/features/cart/actions/cart.action";

export function CartActions({ itemCount }: { itemCount: number }) {
  const router = useRouter();
  const { refresh } = useCart();
  const { refresh: refreshOwned } = useOwnedBooks();
  const toast = useToast();
  const [clearing, startClear] = useTransition();
  const [checking, startCheckout] = useTransition();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleConfirmClear = () => {
    startClear(async () => {
      const result = await clearCartAction();
      if (!result.success) {
        toast.error(result.message || "Could not clear cart");
        setConfirmClearOpen(false);
        return;
      }
      toast.success("Cart cleared");
      setConfirmClearOpen(false);
      void refresh();
    });
  };

  const handleCheckout = () => {
    startCheckout(async () => {
      const result = await checkoutAction();
      if (!result.success) {
        toast.error(result.message || "Checkout failed");
        return;
      }
      toast.success(result.message || "Purchase completed");
      void refresh();
      void refreshOwned(); // BookCards swap to "Owned" / "Read" instantly
      router.push("/dashboard/library");
    });
  };

  const disabled = itemCount === 0 || clearing || checking;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
      >
        {checking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            Checkout securely
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setConfirmClearOpen(true)}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {clearing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Clear cart
      </button>

      <ConfirmDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleConfirmClear}
        tone="danger"
        title="Clear your cart?"
        description="All items currently in your cart will be removed. You'll need to add them again if you change your mind."
        confirmLabel="Clear cart"
        pendingLabel="Clearing…"
        pending={clearing}
      />
    </div>
  );
}
