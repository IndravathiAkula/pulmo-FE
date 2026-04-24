import Link from 'next/link';
import Image from 'next/image';
import { getTrendingBooks } from '@/lib/data-utils';
import { booksService } from '@/server/catalog/books.service';
import { authorsService } from '@/server/catalog/authors.service';
import { adaptBookResponseToBook } from '@/lib/book-adapter';
import { resolveFileUrl } from '@/lib/resolve-file-url';
import type { Book } from '@/app/data/books';
import { FEATURES, SIGNATURE_SERVICES, DEFAULT_DOCTOR, PLATFORM } from '@/lib/constants';
import { HeroBanner } from '@/client/ui/sections/HeroBanner';
import { HorizontalScroller } from '@/client/ui/sections/HorizontalScroller';
import { DiscoverySection } from '@/client/ui/discovery/DiscoverySection';
import { BookCard } from '@/features/books/components/BookCard';
import { RecentlyViewedSection } from '@/features/books/components/RecentlyViewedSection';
import { EmptyState } from '@/client/ui/feedback/EmptyState';
import {
  FileText, ClipboardCheck, MessageCircle, User, ArrowRight,
  Stethoscope, BookOpen, Target, Lightbulb, NotebookPen, GraduationCap,
} from 'lucide-react';

const SERVICE_ICONS = { FileText, ClipboardCheck, MessageCircle } as const;
const FEATURE_ICONS = [Target, NotebookPen, Lightbulb, GraduationCap];

interface HomeAuthor {
  name: string;
  title: string;
  bio: string;
  /** URL slug for /doctors/[id] */
  slug: string;
  /** Resolved absolute URL for the author's profile image, or null. */
  profileUrl: string | null;
}

/**
 * Resolve the data the home page needs: real books + the primary
 * author. Each request is independent — if either fails we fall back
 * to constants/mock so the home page always renders.
 */
async function getHomeData(): Promise<{
  books: Book[];
  author: HomeAuthor;
}> {
  const [booksResult, authorsResult] = await Promise.all([
    booksService.listPublic().catch(() => null),
    authorsService.listPublic().catch(() => null),
  ]);

  const books =
    booksResult && booksResult.ok && booksResult.data.length > 0
      ? booksResult.data.map(adaptBookResponseToBook)
      : getTrendingBooks(8);

  // Primary author: first active real author when present, otherwise
  // fall back to the static DEFAULT_DOCTOR (single-author config).
  const realAuthor =
    authorsResult && authorsResult.ok ? authorsResult.data[0] : null;

  const author: HomeAuthor = realAuthor
    ? {
        name: `${realAuthor.firstName} ${realAuthor.lastName}`,
        title: realAuthor.designation ?? DEFAULT_DOCTOR.title,
        bio: realAuthor.description ?? DEFAULT_DOCTOR.bio,
        slug: `${realAuthor.firstName} ${realAuthor.lastName}`
          .toLowerCase()
          .replace(/\s+/g, '-'),
        profileUrl: resolveFileUrl(realAuthor.profileUrl) ?? null,
      }
    : {
        name: DEFAULT_DOCTOR.name,
        title: DEFAULT_DOCTOR.title,
        bio: DEFAULT_DOCTOR.bio,
        slug: DEFAULT_DOCTOR.name.toLowerCase().replace(/\s+/g, '-'),
        profileUrl: null,
      };

  return { books, author };
}

export default async function Home() {
  const { books: trendingBooks, author } = await getHomeData();

  return (
    <div className="space-y-0 px-4">
      {/* ─────────────────── 1. HERO ─────────────────── */}
      <HeroBanner
        authorName={author.name}
        authorTitle={author.title}
        tagline={PLATFORM.tagline}
        doctorImageUrl={author.profileUrl}
      />

      {/* ─────────────────── 2. RECENTLY VIEWED ─────────────────── */}
      {/* <RecentlyViewedSection /> */}

      {/* ─────────────────── 3. INSIDE PULMO-PREP (Features) ─────────────────── */}
      <section className="py-14 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-widest text-center mb-2">
            Why {PLATFORM.name}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] text-center mb-10 tracking-tight">
            Inside PULMO-PREP
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────── 4. SIGNATURE SERVICES ─────────────────── */}
      <section className="py-16">
        <p className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-widest text-center mb-2">
          Our Services
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] text-center mb-3 tracking-tight">
          Signature Services
        </h2>
        <p className="text-center text-sm text-[var(--color-text-muted)] mb-10 max-w-md mx-auto">
          What makes PulmoPrep your go-to exam companion
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SIGNATURE_SERVICES.map((service, i) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <div key={i} className="bg-white border border-[var(--color-border)] rounded-xl p-7 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-orange-light)] flex items-center justify-center mx-auto mb-4 text-[var(--color-orange)] group-hover:bg-[var(--color-orange)] group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-main)] mb-1.5">
                  {service.title}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
                  {service.description}
                </p>
                <span className="inline-block text-[10px] font-bold text-[var(--color-orange)] bg-[var(--color-orange-light)] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {service.frequency}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────── 5. MEET THE AUTHOR ─────────────────── */}
      <section className="py-14 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-widest text-center mb-2">
            Your Instructor
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] text-center mb-10 tracking-tight">
            Meet the Author
          </h2>
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            {/* `md:items-stretch` lets the image column match the text
                column's natural height on desktop. On mobile the layout
                stacks with text first, image second. */}
            <div className="p-7 md:p-9 flex flex-col md:flex-row gap-7 items-center md:items-stretch">
              {/* Info — LEFT on desktop */}
              <div className="flex-1 min-w-0 text-center md:text-left order-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[var(--color-text-main)]">
                    {author.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[var(--color-accent)] px-2 py-0.5 rounded-full uppercase tracking-wider w-fit mx-auto md:mx-0">
                    <Stethoscope className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--color-primary)] mb-3 uppercase tracking-wider">
                  {author.title}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-5">
                  {author.bio}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center">
                  <Link
                    href={`/doctors/${author.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
                  >
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    {trendingBooks.length} Publications
                  </span>
                </div>
              </div>

              {/* Image — RIGHT on desktop. `md:self-stretch` + `h-full`
                  on the inner box lets the image match the text column
                  height automatically. */}
              <div className="flex-shrink-0 w-full md:w-80 order-2 md:self-stretch">
                <div className="relative w-full h-72 md:h-full min-h-[280px] rounded-xl bg-[var(--color-primary)] overflow-hidden">
                  {author.profileUrl ? (
                    <Image
                      src={author.profileUrl}
                      alt={author.name}
                      fill
                      sizes="(min-width: 768px) 20rem, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── 6. STUDY MATERIALS ─────────────────── */}
      <section className="pt-14 pb-4 ">
        <DiscoverySection
          title="Study Materials"
          subtitle="Curated materials for your Pulmonary Medicine exam preparation."
          viewAllHref="/departments/all-departments"
          viewAllLabel="View All"
          itemCount={trendingBooks.length}
        >
          {trendingBooks.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No study materials yet"
              description="New materials are added regularly — check back soon."
              tone="inline"
            />
          ) : (
            // <HorizontalScroller title="Recommended for You">
              <HorizontalScroller title="">
              {trendingBooks.map((book) => (
                <BookCard key={`trending-${book.id}`} book={book} />
              ))}
            </HorizontalScroller>
          )}
        </DiscoverySection>
      </section>

    </div>
  );
}
