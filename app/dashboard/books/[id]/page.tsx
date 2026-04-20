import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  ExternalLink,
  Tag,
  DollarSign,
  Hash,
  Layers,
  Pencil,
  History,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { getOwnBook } from "@/features/books/actions/book.action";
import { BookStatusPill } from "@/features/books/components/BookStatusPill";
import { DeleteBookButton } from "@/features/books/components/DeleteBookButton";

export default async function MyBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rawBook = await getOwnBook(id);
  if (!rawBook) notFound();

  // Resolve backend-relative file paths so the browser can load them.
  const book = {
    ...rawBook,
    coverUrl: resolveFileUrl(rawBook.coverUrl),
    previewUrl: resolveFileUrl(rawBook.previewUrl),
    bookUrl: resolveFileUrl(rawBook.bookUrl),
  };

  return (
    <div className="max-w-5xl">
      <Link
        href="/dashboard/books"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to my books
      </Link>

      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            {book.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <BookStatusPill status={book.status} />
            <span className="text-xs text-[var(--color-text-muted)] font-semibold">
              {book.categoryName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/books/${id}/history`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
          <Link
            href={`/dashboard/books/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <DeleteBookButton bookId={book.id} bookTitle={book.title} />
        </div>
      </header>

      {book.status === "REJECTED" && book.rejectionReason && (
        <section
          className="rounded-2xl border p-5 mb-6 flex items-start gap-3"
          style={{
            backgroundColor: "#FEF2F2",
            borderColor: "rgba(220, 38, 38, 0.30)",
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-[var(--color-error)] flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-error)]">
              Rejected by admin
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-body)] mt-1 leading-relaxed">
              {book.rejectionReason}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Click Edit Book to address the feedback and resubmit for review.
            </p>
          </div>
        </section>
      )}

      {book.status === "PENDING" && (
        <section
          className="rounded-2xl border p-5 mb-6 flex items-start gap-3"
          style={{
            backgroundColor: "var(--color-peach-light)",
            borderColor: "rgba(249, 168, 88, 0.35)",
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-[var(--color-peach-deep)] flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-peach-deep)]">
              Awaiting admin review
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-body)] mt-1 leading-relaxed">
              Your book is in the moderation queue. You&apos;ll be notified once an admin approves or requests changes.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative w-32 h-44 rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-light)]">
                <BookOpen className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
            <Meta label="Category" icon={<Tag className="w-3.5 h-3.5" />} value={book.categoryName} />
            <Meta
              label="Price"
              icon={<DollarSign className="w-3.5 h-3.5" />}
              value={`$${book.price.toFixed(2)}`}
            />
            {book.discount !== null && book.discount !== undefined && book.discount > 0 && (
              <Meta
                label="Discount"
                icon={<DollarSign className="w-3.5 h-3.5" />}
                value={`-$${book.discount.toFixed(2)}`}
              />
            )}
            {book.pages !== null && book.pages !== undefined && (
              <Meta
                label="Pages"
                icon={<Hash className="w-3.5 h-3.5" />}
                value={String(book.pages)}
              />
            )}
            {book.versionNumber && (
              <Meta
                label="Version"
                icon={<Layers className="w-3.5 h-3.5" />}
                value={book.versionNumber}
              />
            )}
            <Meta
              label="Published"
              icon={<BookOpen className="w-3.5 h-3.5" />}
              value={book.isPublished ? "Yes" : "No"}
            />
          </div>
        </div>

        {book.description && (
          <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
              Description
            </p>
            <p className="text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          </div>
        )}

        {book.keywords && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
              Keywords
            </p>
            <p className="text-sm font-medium text-[var(--color-text-body)]">
              {book.keywords}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-4">
          {book.previewUrl && (
            <a
              href={book.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open preview
            </a>
          )}
          {book.bookUrl && (
            <a
              href={book.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              <FileText className="w-3.5 h-3.5" />
              Open book file
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function Meta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold text-[var(--color-text-main)] mt-0.5 truncate">
        {value}
      </p>
    </div>
  );
}
