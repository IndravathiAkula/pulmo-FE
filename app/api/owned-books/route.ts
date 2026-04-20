/**
 * GET /api/owned-books
 *
 * Returns the current user's owned-book IDs as a JSON array.
 * Used by the client-side <OwnedBooksProvider> so every <BookCard>
 * in the tree can show "Owned" / "Read" instead of cart buttons.
 *
 * - 200 + `{ bookIds: string[] }` when the call succeeds
 * - 200 + `{ bookIds: [] }` when unauthenticated or the BFF call fails
 *   (fail-open — cards just show the cart CTA, which is the safe default)
 */

import { NextResponse } from "next/server";
import { paymentsService } from "@/server/catalog/payments.service";
import { getAccessToken } from "@/server/auth/auth.cookies";

export async function GET() {
  // Short-circuit for guests — don't hit the BFF at all.
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ bookIds: [] });
  }

  const owned = await paymentsService.ownedBookIds();
  return NextResponse.json({ bookIds: Array.from(owned) });
}
