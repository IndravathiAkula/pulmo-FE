/**
 * Adapter: BookResponse (backend) → Book (legacy frontend shape).
 *
 * Most of the existing catalog UI (BookCard, detail page, horizontal
 * scrollers, reader preview components) was built against the mock
 * `@/app/data/books` Book type. Rather than rewrite every consumer,
 * we map the backend DTO onto that shape at the data boundary.
 *
 * Fields missing from the API (rating, reviewCount, tags) get safe
 * defaults — the UI already handles zero-values gracefully.
 */

import type { Book } from "@/app/data/books";
import type { BookResponse } from "@/server/api/apiTypes";
import { resolveFileUrl } from "./resolve-file-url";

const FALLBACK_COVER =
  "https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg?auto=compress&cs=tinysrgb&w=400";

function extractYear(isoDate: string | null | undefined): number {
  if (!isoDate) return new Date().getFullYear();
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.valueOf())) return new Date().getFullYear();
  return parsed.getFullYear();
}

function parseKeywords(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function adaptBookResponseToBook(api: BookResponse): Book {
  // Resolve relative backend paths (e.g. "/ebook/files/covers/abc.jpg")
  // to absolute URLs the browser can actually fetch. This runs server-
  // side; by the time the data reaches Client Components the URLs are
  // already fully qualified.
  const cover = resolveFileUrl(api.coverUrl) ?? FALLBACK_COVER;
  const preview = resolveFileUrl(api.previewUrl) ?? "";
  const bookFile = resolveFileUrl(api.bookUrl) ?? "";

  return {
    id: api.id,
    title: api.title,
    author: api.authorName,
    description: api.description ?? "",
    coverUrl: cover,
    price: api.price,
    discount: api.discount,
    // Legacy Book has `pdfUrl` (reader source). Now that books have a
    // real uploaded file, prefer `bookUrl` → fall back to preview.
    pdfUrl: bookFile || preview,
    pdfPreviewUrl: preview,
    pageCount: api.pages ?? 0,
    category: api.categoryName,
    rating: 0,
    reviewCount: 0,
    publishedYear: extractYear(api.publishedDate),
    tags: parseKeywords(api.keywords),
  };
}

/** Heuristic: API uses UUIDs (36 chars with hyphens), mock uses "1"–"N". */
export function isRealBookId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}
