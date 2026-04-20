/**
 * GET /api/cart/count
 *
 * Returns the current authenticated user's cart line-item count.
 * Used by the client-side <CartProvider> to refresh the navbar badge
 * after add/remove operations.
 *
 * - 200 + `{ count }` when the call succeeds
 * - 200 + `{ count: 0 }` when unauthenticated or the BFF call fails —
 *   the badge silently shows 0 rather than surfacing an error to the
 *   navbar. Real auth issues are caught the next time the user clicks
 *   into a guarded route (handled by middleware + interceptor).
 */

import { NextResponse } from "next/server";
import { getCartSnapshot } from "@/features/cart/actions/cart.action";

export async function GET() {
  const snapshot = await getCartSnapshot();
  return NextResponse.json({
    count: snapshot?.totalItems ?? 0,
    total: snapshot?.totalPrice ?? 0,
    bookIds: snapshot?.items.map((i) => i.bookId) ?? [],
  });
}
