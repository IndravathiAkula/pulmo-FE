"use server";

/**
 * Cart Server Actions.
 *
 * Each action returns the same `{ success, message, data? }` shape the
 * toast system already understands (see useActionStateToast). On success
 * we revalidate the cart + library page paths so they re-render with
 * fresh data on the next read.
 *
 * Cart endpoints in `apiClient` already opt out of Next's data cache
 * (`cache: 'no-store'`), so we don't need `revalidateTag` here — and
 * Next 16's `revalidateTag` requires a cache-lifecycle profile that
 * doesn't apply to no-store fetches anyway.
 */

import { revalidatePath } from "next/cache";
import { cartService } from "@/server/catalog/cart.service";
import { ApiError } from "@/server/api/errors";
import type {
  CartResponse,
  CartItemResponse,
  CheckoutResponse,
} from "@/server/api/apiTypes";

export interface CartActionState<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/** Add a single book to the current user's cart. */
export async function addToCartAction(
  bookId: string
): Promise<CartActionState<CartItemResponse>> {
  if (!bookId) {
    return { success: false, message: "Missing book id" };
  }

  try {
    const result = await cartService.addItem({ bookId });
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/cart");

    return {
      success: true,
      message: result.message ?? "Added to cart",
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not add to cart — please try again",
    };
  }
}

/** Remove a single line item. */
export async function removeFromCartAction(
  bookId: string
): Promise<CartActionState<null>> {
  if (!bookId) {
    return { success: false, message: "Missing book id" };
  }

  try {
    const result = await cartService.removeItem(bookId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/cart");

    return { success: true, message: "Removed from cart", data: null };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not remove item — please try again",
    };
  }
}

/** Empty the cart entirely. */
export async function clearCartAction(): Promise<CartActionState<null>> {
  try {
    const result = await cartService.clear();
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/cart");

    return { success: true, message: "Cart cleared", data: null };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not clear cart — please try again",
    };
  }
}

/** Complete purchase for everything currently in the cart. */
export async function checkoutAction(): Promise<
  CartActionState<CheckoutResponse>
> {
  try {
    const result = await cartService.checkout();
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/cart");
    revalidatePath("/dashboard/library");

    return {
      success: true,
      message: result.message ?? "Purchase completed",
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Checkout failed — please try again",
    };
  }
}

/** Used by the navbar badge + cart-count route handler. */
export async function getCartSnapshot(): Promise<CartResponse | null> {
  try {
    const result = await cartService.get();
    if (!result.ok) return null;
    return result.data;
  } catch {
    return null;
  }
}
