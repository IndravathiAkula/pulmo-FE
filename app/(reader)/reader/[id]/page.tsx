/**
 * reader/[id]/page.tsx – Server Component.
 *
 * Resolves the book from the real backend (or mock fallback), resolves
 * file URLs to absolute, and passes the serializable data to
 * ReaderClient. This avoids the old pattern where the client component
 * looked up books from a stale mock array.
 */

import { booksService } from "@/server/catalog/books.service";
import { adaptBookResponseToBook } from "@/lib/book-adapter";
import { books } from "@/app/data/books";
import { ReaderClient } from "./ReaderClient";

export interface ReaderBookData {
  id: string;
  title: string;
  coverUrl: string;
  author: string;
  pageCount: number;
  /** Fully resolved URL to the book's PDF/EPUB. Empty string if none. */
  pdfUrl: string;
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Try real backend first, fall back to mock catalog.
  let bookData: ReaderBookData | null = null;

  try {
    const result = await booksService.getPublic(id);
    if (result.ok) {
      const adapted = adaptBookResponseToBook(result.data);
      bookData = {
        id: adapted.id,
        title: adapted.title,
        coverUrl: adapted.coverUrl,
        author: adapted.author,
        pageCount: adapted.pageCount,
        pdfUrl: adapted.pdfUrl,
      };
    }
  } catch {
    // swallow — fall through to mock
  }

  if (!bookData) {
    const mock = books.find((b) => b.id === id);
    if (mock) {
      bookData = {
        id: mock.id,
        title: mock.title,
        coverUrl: mock.coverUrl,
        author: mock.author,
        pageCount: mock.pageCount,
        pdfUrl: mock.pdfUrl,
      };
    }
  }

  return <ReaderClient id={id} bookData={bookData} />;
}
