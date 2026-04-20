import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import { categoriesService } from "@/server/catalog/categories.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { getOwnBook } from "@/features/books/actions/book.action";
import { BookForm } from "@/features/books/components/BookForm";
import { DeleteBookButton } from "@/features/books/components/DeleteBookButton";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [book, categoriesResult] = await Promise.all([
    getOwnBook(id),
    categoriesService.list(),
  ]);

  if (!book) notFound();

  // Resolve relative backend file paths to absolute URLs so the
  // FileUpload previews render correctly in the client component.
  const resolvedBook = {
    ...book,
    coverUrl: resolveFileUrl(book.coverUrl) ?? book.coverUrl,
    previewUrl: resolveFileUrl(book.previewUrl) ?? book.previewUrl,
    bookUrl: resolveFileUrl(book.bookUrl) ?? book.bookUrl,
  };

  const categories = categoriesResult.ok ? categoriesResult.data : [];

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/books"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to my books
      </Link>

      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Edit book
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Saving will resubmit this book for admin review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/books/${id}/history`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            View history
          </Link>
          <DeleteBookButton bookId={book.id} bookTitle={book.title} />
        </div>
      </header>

      <BookForm mode="edit" categories={categories} book={resolvedBook} />
    </div>
  );
}
