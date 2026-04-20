/**
 * /api/pdf/[id] — BFF proxy for authenticated book-file downloads.
 *
 * Why this exists:
 *   The backend gates `/ebook/files/books/*.pdf` behind a Bearer token.
 *   A raw browser fetch to that URL can't attach the token (it lives in
 *   HttpOnly cookies on OUR domain, not on the backend's), so the file
 *   never reaches the reader — backend responds 403.
 *
 *   This Route Handler runs server-side, reads our session cookie, and
 *   re-fetches the backend URL with `Authorization: Bearer`, streaming
 *   the PDF bytes back to the browser. The browser only ever sees our
 *   own origin — cross-origin auth is eliminated.
 *
 * Defense-in-depth:
 *   1. No access token  → 401.
 *   2. User doesn't own the book (`ownedBookIds`) → 403 even if the id
 *      is a real book. Prevents URL-tampering by the client.
 *   3. Book has no file uploaded → 404.
 *   4. Backend errors on the file fetch → 502.
 *
 * Streaming:
 *   `pdfRes.body` is forwarded directly as a ReadableStream. Large books
 *   (50MB+) don't buffer in memory on this hop.
 */

import { NextResponse } from "next/server";
import { getAccessToken } from "@/server/auth/auth.cookies";
import { booksService } from "@/server/catalog/books.service";
import { paymentsService } from "@/server/catalog/payments.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Session check
  const token = await getAccessToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Ownership check — must happen server-side; client `owns()` is
  //    advisory UX only and can be spoofed.
  const ownedIds = await paymentsService.ownedBookIds();
  if (!ownedIds.has(id)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Resolve the file URL from the backend's book metadata. The
  //    public-book endpoint is fine for reading metadata; it doesn't
  //    leak the binary.
  const bookResult = await booksService.getPublic(id);
  if (!bookResult.ok) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const rawBookUrl = bookResult.data.bookUrl;
  if (!rawBookUrl) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const absoluteBookUrl = resolveFileUrl(rawBookUrl) ?? rawBookUrl;

  // 4. Fetch the file from backend WITH the Bearer token attached.
  let pdfRes: Response;
  try {
    pdfRes = await fetch(absoluteBookUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("Bad Gateway", { status: 502 });
  }

  if (!pdfRes.ok || !pdfRes.body) {
    // Preserve backend status (401 → 401, 404 → 404, 500 → 502) so the
    // client can distinguish "you just got logged out" from "file gone".
    const status = pdfRes.status === 401 ? 401 : pdfRes.status >= 500 ? 502 : pdfRes.status;
    return new NextResponse(null, { status });
  }

  // 5. Stream bytes through. Set a tight Cache-Control — this is
  //    authenticated private content; never cache at any intermediary.
  return new NextResponse(pdfRes.body, {
    status: 200,
    headers: {
      "Content-Type": pdfRes.headers.get("content-type") ?? "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
