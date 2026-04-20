"use client";

/**
 * ReaderClient – Client Island for the secure reader page.
 *
 * Receives resolved book data from the Server Component page (no more
 * mock-array lookup). Uses:
 *   - `useSession()` for auth (not the stale `useAuthStore`)
 *   - `useOwnedBooks()` for ownership (not the stale `usePaymentStore`)
 *   - `bookData.pdfUrl` directly for the PDF source (not the `/api/pdf/` proxy)
 *
 * The PDF is still fetched as a blob to create a `blob:` URL — this
 * prevents the raw backend URL from being visible in the viewer iframe,
 * adding a light DRM layer consistent with the original design.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ShoppingCart,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import dynamic from "next/dynamic";

import { useSession } from "@/client/auth/SessionProvider";
import { useOwnedBooks } from "@/client/owned-books/OwnedBooksProvider";
import { FullscreenReaderShell } from "@/features/reader/components/FullscreenReaderShell";
import { useTrackRecentBook } from "@/client/hooks/useTrackRecentBook";
import type { ReaderBookData } from "./page";

const SecureReader = dynamic(
  () =>
    import("@/features/reader/components/SecureReader").then(
      (mod) => mod.SecureReader
    ),
  { ssr: false }
);

export interface ReaderClientProps {
  id: string;
  bookData: ReaderBookData | null;
}

export function ReaderClient({ id, bookData }: ReaderClientProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useSession();
  const { owns } = useOwnedBooks();

  const [mounted, setMounted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleClose = () => router.push(`/books/${id}`);

  // Hydration check
  useEffect(() => {
    setMounted(true);
  }, []);

  const purchased = owns(id);

  // Track as recently viewed once the PDF has loaded
  useTrackRecentBook(
    {
      id: bookData?.id ?? "",
      title: bookData?.title ?? "",
      cover: bookData?.coverUrl ?? "",
      doctor: bookData?.author ?? "",
    },
    !!pdfUrl
  );

  // PDF fetch — convert the resolved URL to a blob: URL for DRM.
  useEffect(() => {
    if (!mounted || !bookData?.pdfUrl || !isAuthenticated || !purchased)
      return;

    let active = true;
    let blobUrl: string | null = null;
    setLoadingPdf(true);
    setPdfError(false);

    fetch(bookData.pdfUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load PDF");
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (!active) return;
        blobUrl = URL.createObjectURL(new Blob([buf]));
        setPdfUrl(blobUrl);
      })
      .catch(() => {
        if (active) {
          setPdfUrl(null);
          setPdfError(true);
        }
      })
      .finally(() => {
        if (active) setLoadingPdf(false);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [mounted, bookData?.pdfUrl, isAuthenticated, purchased]);

  // ── Book not found ──────────────────────────────────────────
  if (!bookData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-body)] mb-2">
            Book not found
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            The book you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all"
          >
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  // ── Hydration wait ──────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-500/50" />
          </div>
          <div className="text-center">
            <p className="text-[var(--color-text-main)] font-semibold text-lg">
              Checking your access...
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Verifying secure credentials
            </p>
          </div>
          <div className="w-8 h-8 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Not logged in ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white animate-in fade-in duration-500">
        <div className="max-w-md w-full glass-card p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] text-center shadow-lg">
          <div className="w-20 h-20 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">
            Login Required
          </h2>
          <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
            You need to sign in to continue reading this secure medical
            document.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?from=/reader/${id}`}
              className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-center"
            >
              Sign In
            </Link>
            <Link
              href={`/books/${id}`}
              className="w-full py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] text-[var(--color-text-body)] rounded-xl font-medium transition-colors border border-[var(--color-border)] text-center"
            >
              Back to Book Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not purchased ───────────────────────────────────────────
  if (!purchased) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white animate-in fade-in duration-500">
        <div className="max-w-md w-full glass-card p-8 rounded-[var(--radius-xl)] border border-amber-500/20 text-center shadow-lg">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">
            Purchase Required
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
            You must unlock{" "}
            <span className="text-[var(--color-text-body)] font-semibold">
              {bookData.title}
            </span>{" "}
            to access the reader.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/books/${id}`}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 text-center"
            >
              View Purchase Options
            </Link>
            <Link
              href="/departments/all-departments"
              className="w-full py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] text-[var(--color-text-body)] rounded-xl font-medium transition-colors border border-[var(--color-border)] text-center"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── No PDF URL available ────────────────────────────────────
  if (!bookData.pdfUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[var(--color-peach-light)] rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[var(--color-peach-deep)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">
            File not available
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
            The book file hasn&apos;t been uploaded yet. The author may
            still be preparing it.
          </p>
          <Link
            href={`/books/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all"
          >
            Back to Book Details
          </Link>
        </div>
      </div>
    );
  }

  // ── PDF fetch failed ─────────────────────────────────────────
  if (pdfError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[var(--color-error)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">
            Could not load book
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
            The book file could not be fetched from the server. It may have
            been removed or the server is temporarily unavailable. Try again
            or contact support if the problem persists.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setPdfError(false);
                setLoadingPdf(true);
                // Re-trigger the effect by forcing a state change.
                setPdfUrl(null);
              }}
              className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-bold transition-all text-center"
            >
              Try again
            </button>
            <Link
              href={`/books/${id}`}
              className="w-full py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] text-[var(--color-text-body)] rounded-xl font-medium transition-colors border border-[var(--color-border)] text-center"
            >
              Back to Book Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading PDF ─────────────────────────────────────────────
  if (loadingPdf || !pdfUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white animate-in fade-in-0 duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-[var(--color-text-main)] font-semibold text-lg">
              Preparing your reader...
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Decrypting secure medical content
            </p>
          </div>
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Render PDF ──────────────────────────────────────────────
  return (
    <FullscreenReaderShell title={bookData.title} onClose={handleClose}>
      <SecureReader
        pdfUrl={pdfUrl}
        totalPages={bookData.pageCount}
        userName={user ? `${user.firstName} ${user.lastName}`.trim() : ""}
        userEmail={user?.email ?? ""}
        bookTitle={bookData.title}
      />
    </FullscreenReaderShell>
  );
}
