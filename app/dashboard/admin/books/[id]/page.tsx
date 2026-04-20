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
  User,
} from "lucide-react";
import { booksService } from "@/server/catalog/books.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { BookStatusPill } from "@/features/books/components/BookStatusPill";
import { ApprovalHistoryTimeline } from "@/features/books/components/ApprovalHistoryTimeline";
import { AdminBookActions } from "@/features/admin/components/AdminBookActions";

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [bookResult, historyResult] = await Promise.all([
    booksService.adminGet(id),
    booksService.adminHistory(id),
  ]);

  if (!bookResult.ok) notFound();
  const rawBook = bookResult.data;
  // Resolve relative file paths to absolute URLs so images and links
  // actually work in the browser (backend returns paths like
  // "/ebook/files/covers/abc.jpg" which resolve against the wrong host).
  const book = {
    ...rawBook,
    coverUrl: resolveFileUrl(rawBook.coverUrl),
    previewUrl: resolveFileUrl(rawBook.previewUrl),
    bookUrl: resolveFileUrl(rawBook.bookUrl),
  };
  const history = historyResult.ok ? historyResult.data : [];

  return (
    <div className="max-w-5xl">
      <Link
        href="/dashboard/admin/books?tab=pending"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to moderation
      </Link>

      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
            {book.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <BookStatusPill status={book.status} />
            <span className="text-xs text-[var(--color-text-muted)] font-semibold inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {book.authorName}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Book info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover + key meta */}
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

            {book.previewUrl && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <a
                  href={book.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Open preview PDF
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </section>

          {/* Approval history */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-5">
              Approval History
            </h2>
            <ApprovalHistoryTimeline entries={history} />
          </section>
        </div>

        {/* RIGHT: Actions */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
              <header
                className="px-5 py-4 border-b border-[var(--color-border)]"
                style={{
                  background:
                    "linear-gradient(135deg, #FFF8F0 0%, #FFECD2 50%, #E8EFF8 100%)",
                }}
              >
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text-main)]">
                  Decision
                </h2>
              </header>
              <div className="p-5">
                <AdminBookActions bookId={book.id} status={book.status} />
              </div>
            </section>

            {book.status === "REJECTED" && book.rejectionReason && (
              <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-error)]">
                  Last rejection reason
                </p>
                <p className="text-sm text-[var(--color-text-body)] mt-2 leading-relaxed">
                  {book.rejectionReason}
                </p>
              </section>
            )}
          </div>
        </aside>
      </div>
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
