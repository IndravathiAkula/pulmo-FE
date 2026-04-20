import "server-only";

/**
 * Cart service — `/cart*` endpoints. All routes require auth.
 *
 * `checkout` creates a Payment record, unlocks books for the user, and
 * empties the cart. Callers should `revalidateTag('cart')` and
 * `revalidateTag('library')` after a successful checkout.
 */

import { apiClient } from "../api/apiClient";
import { CART_ROUTES } from "../api/apiRoutes";
import type {
  ApiResult,
  CartResponse,
  CartItemResponse,
  AddCartItemRequest,
  CheckoutResponse,
} from "../api/apiTypes";

export const cartService = {
  async get(): Promise<ApiResult<CartResponse>> {
    return apiClient<CartResponse>(CART_ROUTES.get, { method: "GET" });
  },

  async addItem(
    data: AddCartItemRequest
  ): Promise<ApiResult<CartItemResponse>> {
    return apiClient<CartItemResponse>(CART_ROUTES.addItem, {
      method: "POST",
      body: data,
    });
  },

  async removeItem(bookId: string): Promise<ApiResult<null>> {
    return apiClient<null>(CART_ROUTES.removeItem(bookId), {
      method: "DELETE",
    });
  },

  async clear(): Promise<ApiResult<null>> {
    return apiClient<null>(CART_ROUTES.clear, { method: "DELETE" });
  },

  /**
   * Purchases everything currently in the cart.
   *
   * An `Idempotency-Key` header is ALWAYS sent — the backend uses it to
   * dedupe accidental double-submits (network retries, rapid double-
   * click) so a user can't end up with two payments for the same cart.
   * Pass a stable `idempotencyKey` from the caller when you need retries
   * to collapse to the same payment; omit it and the service generates
   * a fresh UUID per call (safe default for single-shot invocations).
   */
  async checkout(
    idempotencyKey?: string
  ): Promise<ApiResult<CheckoutResponse>> {
    const key = idempotencyKey ?? crypto.randomUUID();
    return apiClient<CheckoutResponse>(CART_ROUTES.checkout, {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
  },
};
