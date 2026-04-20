import { ShoppingBag, ArrowRight } from "lucide-react";
import { cartService } from "@/server/catalog/cart.service";
import type { CartResponse } from "@/server/api/apiTypes";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartActions } from "@/features/cart/components/CartActions";
import { EmptyState } from "@/client/ui/feedback/EmptyState";

/**
 * /cart — server-rendered cart view.
 *
 * The line items, totals, and action buttons all live inside small
 * client components that call server actions. This page itself stays
 * a Server Component so it picks up `revalidateTag('cart')` / pathname
 * revalidations from the cart actions and re-renders with fresh data.
 */
export default async function CartPage() {
  const result = await cartService.get();
  // On any failure (most likely "no cart yet" or transient), render an
  // empty-cart state instead of an error — same UX as a real empty cart.
  const raw: CartResponse = result.ok
    ? result.data
    : { items: [], totalItems: 0, totalPrice: 0 };

  // Resolve relative backend file URLs to absolute so client components
  // (CartItemRow cover images) render correctly.
  const cart: CartResponse = {
    ...raw,
    items: raw.items.map((item) => ({
      ...item,
      coverUrl: resolveFileUrl(item.coverUrl) ?? item.coverUrl,
    })),
  };

  const isEmpty = cart.items.length === 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]/70">
            Your Cart
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {isEmpty
              ? "Your cart is empty — add a book to get started."
              : `${cart.totalItems} ${cart.totalItems === 1 ? "item" : "items"} ready for checkout`}
          </p>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the catalog to find books worth adding. Anything you save here will be ready for checkout."
          action={{
            label: "Browse books",
            href: "/departments/all-departments",
            icon: ArrowRight,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <ul className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <CartItemRow key={item.bookId} item={item} />
            ))}
          </ul>

          {/* Summary card */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
              <div
                className="px-5 py-4 border-b border-[var(--color-border)]"
                style={{
                  background:
                    "linear-gradient(135deg, #FFF8F0 0%, #FFECD2 50%, #E8EFF8 100%)",
                }}
              >
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text-main)]">
                  Order Summary
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">
                    Items ({cart.totalItems})
                  </span>
                  <span className="font-semibold text-[var(--color-text-body)] tabular-nums">
                    ${cart.totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="h-px bg-[var(--color-border)]" />

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[var(--color-text-main)]">
                    Total
                  </span>
                  <span className="text-2xl font-black text-[var(--color-text-main)] tabular-nums">
                    ${cart.totalPrice.toFixed(2)}
                  </span>
                </div>

                <CartActions itemCount={cart.items.length} />

                {/* Demo-mode disclosure — honest UX until a real
                    payment gateway is wired on the backend. */}
                {/* <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--color-peach-light)] border border-[var(--color-peach)]/25 text-[11px] leading-relaxed text-[var(--color-peach-deep)]">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-black uppercase tracking-wider">
                      Demo checkout
                    </span>
                    {" — "}
                    No real payment is charged. Clicking Checkout flags
                    the order as completed and unlocks the books in your
                    library.
                  </span>
                </div> */}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

