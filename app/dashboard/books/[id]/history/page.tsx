import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { booksService } from "@/server/catalog/books.service";
import { getOwnBook } from "@/features/books/actions/book.action";
import { BookStatusPill } from "@/features/books/components/BookStatusPill";
import { ApprovalHistoryTimeline } from "@/features/books/components/ApprovalHistoryTimeline";

export default async function BookHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [book, historyResult] = await Promise.all([
    getOwnBook(id),
    booksService.myHistory(id),
  ]);

  if (!book) notFound();

  const entries = historyResult.ok ? historyResult.data : [];

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/books"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to my books
      </Link>

      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]/70 mb-3">
            Approval History
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
            {book.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <BookStatusPill status={book.status} />
            <span className="text-xs text-[var(--color-text-muted)] font-semibold">
              {book.categoryName}
            </span>
          </div>
        </div>

        <Link
          href={`/dashboard/books/${id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white transition-colors self-start"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6 sm:p-8">
        <ApprovalHistoryTimeline entries={entries} />
      </section>
    </div>
  );
}
