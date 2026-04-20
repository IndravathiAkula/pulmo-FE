import Link from 'next/link';
import Image from 'next/image';
import { books } from '@/app/data/books';
import { Star, BookOpen, ChevronLeft, Calendar, Tag, ShieldCheck, User, Clock } from 'lucide-react';
import { PurchaseSection } from '@/features/books/components/PurchaseSection';
import { BookDetailActions } from '@/features/books/components/BookDetailActions';
import { PreviewViewerDynamic } from '@/features/books/components/PreviewViewerDynamic';
import { Badge } from '@/client/ui/Badge';
import { Button } from '@/client/ui/Button';
import { HorizontalScroller } from '@/client/ui/sections/HorizontalScroller';
import { BookCard } from '@/features/books/components/BookCard';
import { booksService } from '@/server/catalog/books.service';
import { paymentsService } from '@/server/catalog/payments.service';
import { getSessionLight } from '@/server/auth/auth.session';
import { adaptBookResponseToBook } from '@/lib/book-adapter';
import type { BookResponse } from '@/server/api/apiTypes';
import type { Book } from '@/app/data/books';

/**
 * Resolution strategy:
 *   1. Try the real /books/{id} endpoint. If found → use real data and
 *      render the live-cart CTA (<BookDetailActions>).
 *   2. If the backend returns 404 (or any failure), fall back to the
 *      local mock catalog and keep the legacy <PurchaseSection>.
 * This lets both systems coexist during the migration.
 */
async function resolveBook(
    id: string
): Promise<{ book: Book; realSource: BookResponse | null } | null> {
    try {
        const result = await booksService.getPublic(id);
        if (result.ok) {
            return { book: adaptBookResponseToBook(result.data), realSource: result.data };
        }
    } catch {
        // swallow — fall through to mock
    }
    const mock = books.find((b) => b.id === id);
    return mock ? { book: mock, realSource: null } : null;
}

export default async function BookPreview({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const resolved = await resolveBook(resolvedParams.id);
    const book = resolved?.book;
    const realBook = resolved?.realSource ?? null;

    if (!book) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <p className="text-6xl mb-6">📚</p>
                    <h2 className="text-3xl font-extrabold text-[var(--color-text-main)] mb-3">Book not found</h2>
                    <p className="text-[var(--color-text-muted)] mb-8">The medical resource you are looking for is unavailable.</p>
                    <Link href="/">
                        <Button variant="secondary" size="lg">← Back to Library</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Related literature: for real books fetch siblings from
    // /books/category/{id}; for mock books fall back to the local
    // category filter so the UX is uniform.
    const relatedBooks = realBook
        ? await booksService
              .listByCategory(realBook.categoryId)
              .then((res) =>
                  res.ok
                      ? res.data
                            .filter((b) => b.id !== realBook.id)
                            .map(adaptBookResponseToBook)
                      : []
              )
              .catch(() => [])
        : books.filter((b) => b.category === book.category && b.id !== book.id);

    // Ownership lookup — only call the authenticated /payments/my/books
    // endpoint when the user is actually logged in, otherwise the
    // interceptor's 401 → refresh path runs in a Server Component
    // (which can't write rotated cookies). For guests we just default
    // to "not owned" and render the cart CTAs.
    const sessionLight = await getSessionLight();
    let isOwned = false;
    if (sessionLight.isAuthenticated && realBook) {
        const owned = await paymentsService.ownedBookIds();
        isOwned = owned.has(realBook.id);
    }

    const doctorSlug = book.author.toLowerCase().replace(/\s+/g, '-');

    return (
        <main className="max-w-[1800px] mx-auto py-6 sm:py-10">
            {/* Breadcrumbs - Minimal & Pro */}
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-8 px-4 sm:px-0">
                <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Library</Link>
                <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
                <Link href={`/departments/${book.category.toLowerCase()}`} className="hover:text-[var(--color-primary)] transition-colors">{book.category}</Link>
                <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
                <span className="text-[var(--color-text-body)] truncate max-w-[150px] sm:max-w-none">{book.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-0">

                {/* LEFT COLUMN (7/12): Book Info & Details */}
                <div className="lg:col-span-7 flex flex-col gap-8">

                    {/* Hero Info Card */}
                    <div className="glass-card p-6 sm:p-10 relative overflow-hidden group">
                        {/* Abstract background flare */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary-light)] blur-[100px] rounded-full group-hover:bg-[var(--color-primary-light)] transition-colors" />

                        <div className="relative flex flex-col sm:flex-row gap-8 items-start">
                            {/* Book Cover Container */}
                            <div className="w-full sm:w-48 flex-shrink-0">
                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-[var(--color-border)] bg-white">
                                    <Image
                                        src={book.coverUrl}
                                        alt={book.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {/* <div className="absolute top-3 left-3">
                                        <Badge className="bg-white/90 border border-[var(--color-border-hover)] text-[10px] uppercase font-black px-2 py-0.5 shadow-lg">
                                            {book.category}
                                        </Badge>
                                    </div> */}
                                </div>
                            </div>

                            {/* Essential Info */}
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" />
                                    Verified Publication
                                </div>

                                <h1 className="text-3xl md:text-4xl font-black text-[var(--color-text-main)] leading-tight tracking-tight">
                                    {book.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 pt-2">
                                    <Link href={`/doctors/${doctorSlug}`} className="group/author flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover/author:bg-[var(--color-primary-hover)] group-hover/author:text-white transition-all">
                                            <User className="h-5 w-5 group-hover/author:text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Author</span>
                                            <span className="text-sm font-bold text-[var(--color-text-body)] group-hover/author:text-[var(--color-primary)] transition-colors">{book.author}</span>
                                        </div>
                                    </Link>

                                    <div className="h-8 w-px bg-[var(--color-border)]" />

                                    {/* <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Clinical Rating</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-[var(--color-text-main)]">{book.rating}</span>
                                            <div className="flex text-amber-500 gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(book.rating) ? 'fill-current' : 'opacity-20'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div> */}
                                </div>

                                <p className="text-base text-[var(--color-text-muted)] leading-relaxed max-w-2xl pt-4">
                                    {book.description}
                                </p>
                            </div>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-[var(--color-border)]">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Length</span>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="text-sm font-bold text-[var(--color-text-body)]">{book.pageCount} Pages</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Released</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="text-sm font-bold text-[var(--color-text-body)]">{book.publishedYear}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Topics</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {book.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[9px] font-bold text-[var(--color-primary)]/80 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/10 px-1.5 py-0.5 rounded uppercase">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase & Access Section */}
                    <div className="glass-card p-1 overflow-hidden">
                        {/* <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">License Acquisition</h3>

                        </div> */}
                        <div className="p-8">
                            {/* Legacy price + label is shown only on the
                                mock fallback path, because <BookDetailActions>
                                renders its own price (with strike-through +
                                discount) and would otherwise display it twice. */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                                {!realBook && (
                                    <div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-4xl font-black text-[var(--color-text-main)] tabular-nums">${book.price}</span>
                                            <span className="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-tighter">Professional Access</span>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Verified credentials required for certain journals</p>
                                    </div>
                                )}
                                <div className="flex flex-row gap-4">
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-bold">
                                        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" /> Full DRM Protection
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-bold">
                                        <BookOpen className="w-4 h-4 text-[var(--color-primary)]" /> Read in Secure Reader
                                    </div>
                                </div>
                            </div>
                            {realBook ? (
                                <BookDetailActions
                                    bookId={realBook.id}
                                    price={realBook.price}
                                    discount={realBook.discount}
                                    isOwned={isOwned}
                                />
                            ) : (
                                <PurchaseSection book={book} />
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (5/12): Interactive Preview */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                    <div className="glass-card p-1 overflow-hidden sticky top-24 pt-2">
                        <div className="p-1 bg-[var(--color-surface)]">
                            <div className="relative group">
                                <PreviewViewerDynamic book={book} />
                                {/* Bottom masking gradient for premium look */}
                                <div className="absolute bottom-0 left-0 right-0 h-40 z-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Resources - Full Width */}
            {relatedBooks.length > 0 && (
                <div className="mt-10 pt-10 border-t border-[var(--color-border)]">
                    <HorizontalScroller
                        title="Essential Related Literature"
                        subtitle={`Commonly referenced textbooks within the ${book.category} department.`}
                    >
                        {relatedBooks.map(b => (
                            <BookCard key={b.id} book={b} />
                        ))}
                    </HorizontalScroller>
                </div>
            )}

            {/* Platform Footer Citation */}
            <footer className="mt-24 text-center px-4">
                <div className="inline-flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">PulmoPrep Medical Platform 2026</span>
                </div>
            </footer>
        </main>
    );
}