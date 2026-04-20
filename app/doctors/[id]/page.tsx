import Link from 'next/link';
import Image from 'next/image';
import { books as mockBooks } from '@/app/data/books';
import {
  User,
  BookOpen,
  Mail,
  MapPin,
  Stethoscope,
  ChevronLeft,
  Briefcase,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { DEFAULT_DOCTOR } from '@/lib/constants';
import { Button } from '@/client/ui/Button';
import { HorizontalScroller } from '@/client/ui/sections/HorizontalScroller';
import { BookCard } from '@/features/books/components/BookCard';
import { authorsService } from '@/server/catalog/authors.service';
import { booksService } from '@/server/catalog/books.service';
import { adaptBookResponseToBook } from '@/lib/book-adapter';
import { resolveFileUrl } from '@/lib/resolve-file-url';
import type { AuthorResponse } from '@/server/api/apiTypes';
import type { Book } from '@/app/data/books';

interface DoctorView {
  name: string;
  title: string;
  specialization: string;
  bio: string;
  location: string;
  email: string;
  profileUrl: string | null;
  qualification: string | null;
}

interface ResolvedDoctor {
  doctor: DoctorView;
  books: Book[];
  /** True when sourced from the real authors API. */
  fromApi: boolean;
}

function authorSlug(a: { firstName: string; lastName: string }): string {
  return `${a.firstName} ${a.lastName}`
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Resolve a /doctors/[id] request:
 *   1. Try the real /authors list. If the slug matches an author,
 *      use their public profile + fetch their books from
 *      /books/author/{id}.
 *   2. Otherwise fall back to the legacy DEFAULT_DOCTOR + mock
 *      catalog so the existing /doctors/dr.-rohan link keeps working
 *      while the catalog is being seeded.
 *
 * Returns null when neither source has a match — the page renders a
 * 404-style "not found" view in that case.
 */
async function resolveDoctor(id: string): Promise<ResolvedDoctor | null> {
  // Real path
  try {
    const result = await authorsService.listPublic();
    if (result.ok) {
      const match: AuthorResponse | undefined = result.data.find(
        (a) => authorSlug(a) === id
      );
      if (match) {
        const booksResult = await booksService
          .listByAuthor(match.id)
          .catch(() => null);
        const realBooks =
          booksResult && booksResult.ok
            ? booksResult.data.map(adaptBookResponseToBook)
            : [];

        return {
          doctor: {
            name: `${match.firstName} ${match.lastName}`,
            title: match.designation ?? 'Author',
            specialization: match.designation ?? 'Specialist',
            bio: match.description ?? '',
            location: '',
            email: match.email,
            profileUrl: resolveFileUrl(match.profileUrl) ?? null,
            qualification: match.qualification ?? null,
          },
          books: realBooks,
          fromApi: true,
        };
      }
    }
  } catch {
    // fall through to mock
  }

  // Mock fallback (legacy /doctors/dr.-rohan link)
  const fallbackBooks = mockBooks.filter(
    (b) => b.author.toLowerCase().replace(/\s+/g, '-') === id
  );
  if (fallbackBooks.length === 0) return null;

  return {
    doctor: {
      ...DEFAULT_DOCTOR,
      profileUrl: null,
      qualification: null,
    },
    books: fallbackBooks,
    fromApi: false,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const resolved = await resolveDoctor(resolvedParams.id);

  if (!resolved) {
    return (
      <main className="max-w-3xl mx-auto py-12">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
          <div
            className="px-6 py-16 sm:py-20 flex flex-col items-center text-center"
            style={{
              background:
                'linear-gradient(135deg, #FFF8F0 0%, #FFECD2 25%, #FCE4D4 50%, #F0E6F0 75%, #E8EFF8 100%)',
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5">
              <User className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-xl font-extrabold text-[var(--color-text-main)] mb-2">
              Author not found
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed">
              We couldn&apos;t locate this author profile. They may have been
              deactivated or the link is out of date.
            </p>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { doctor, books: doctorBooks } = resolved;
  const initials = doctor.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="max-w-screen-xl mx-auto py-8 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-1">
        <Link
          href="/"
          className="hover:text-[var(--color-primary)] transition-colors"
        >
          Home
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
        <span className="text-[var(--color-text-body)]">About the Author</span>
      </nav>

      {/* ── Profile Hero Card ── */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-xl bg-[var(--color-background)]">
        {/* Pastel-gradient banner with soft animated blobs (matches HeroBanner) */}
        <div
          className="relative h-24 md:h-28"
          style={{
            background:
              'linear-gradient(135deg, #FFF8F0 0%, #FFECD2 25%, #FCE4D4 50%, #F0E6F0 75%, #E8EFF8 100%)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-10 -left-10 w-60 h-60 rounded-full blur-3xl animate-pulse-soft"
              style={{ backgroundColor: 'rgba(255, 219, 181, 0.35)' }}
            />
            <div
              className="absolute -bottom-16 right-0 w-72 h-72 rounded-full blur-3xl animate-pulse-soft"
              style={{
                backgroundColor: 'rgba(212, 229, 247, 0.30)',
                animationDelay: '2s',
              }}
            />
            <div
              className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full blur-3xl animate-pulse-soft"
              style={{
                backgroundColor: 'rgba(245, 213, 224, 0.25)',
                animationDelay: '1s',
              }}
            />
          </div>

          <div className="relative z-10 px-6 md:px-10 pt-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]/70">
              Author Profile
            </p>
          </div>
        </div>

        {/* Identity block — overlaps banner */}
        <div className="relative px-6 md:px-10 pb-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-14 mb-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl ring-4 ring-white overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary-start) 0%, var(--color-primary-end) 100%)',
                }}
              >
                {doctor.profileUrl ? (
                  <Image
                    src={doctor.profileUrl}
                    alt={doctor.name}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : initials ? (
                  initials
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              {/* Specialty cue badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
                {doctor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderColor: 'rgba(30, 58, 95, 0.20)',
                  }}
                >
                  <Briefcase className="w-3 h-3" />
                  {doctor.title}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--color-accent-light)',
                    color: 'var(--color-accent-hover)',
                    borderColor: 'rgba(34, 197, 94, 0.30)',
                  }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  Verified Author
                </span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 border-t border-[var(--color-border)]">
            {/* About */}
            <div className="lg:col-span-10 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
                  About
                </p>
                <p className="text-[var(--color-text-body)] leading-relaxed text-[15px]">
                  {doctor.bio || 'Bio coming soon.'}
                </p>
              </div>

              {/* Contact chips — match Profile page tinted-chip style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ContactChip
                  icon={<GraduationCap className="w-4 h-4" />}
                  label="Qualification"
                  value={doctor.qualification!}
                  tint="peach"
                />
                <ContactChip
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={doctor.email}
                  tint="sky"
                />
              </div>
            </div>

            {/* Publications stat tile */}
            <div className="lg:col-span-2">
              <div
                className="rounded-2xl border border-[var(--color-border)] p-6 h-full flex flex-col items-center text-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #FFF8F0 0%, #FFECD2 50%, #E8EFF8 100%)',
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <span className="text-4xl font-black text-[var(--color-text-main)] tabular-nums leading-none">
                  {doctorBooks.length}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mt-2">
                  {doctorBooks.length === 1 ? 'Publication' : 'Publications'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publications */}
      {doctorBooks.length > 0 && (
        <section>
          <HorizontalScroller
            title={`Study Materials by ${doctor.name}`}
            subtitle={`Published Materials by ${doctor.name}.`}
          >
            {doctorBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </HorizontalScroller>
        </section>
      )}
    </main>
  );
}

/* ── Reusable bits ─────────────────────────────────────────── */

type ChipTint = 'primary' | 'sky' | 'peach' | 'accent';

function ContactChip({
  icon,
  label,
  value,
  tint = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  tint?: ChipTint;
}) {
  const tintMap: Record<ChipTint, { bg: string; fg: string }> = {
    primary: {
      bg: 'var(--color-primary-light)',
      fg: 'var(--color-primary)',
    },
    sky: { bg: 'var(--color-sky-light)', fg: 'var(--color-blue-500)' },
    peach: {
      bg: 'var(--color-peach-light)',
      fg: 'var(--color-peach-deep)',
    },
    accent: {
      bg: 'var(--color-accent-light)',
      fg: 'var(--color-accent-hover)',
    },
  };
  const { bg, fg } = tintMap[tint];

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-white transition-all">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bg, color: fg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="text-sm font-semibold text-[var(--color-text-body)] mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
