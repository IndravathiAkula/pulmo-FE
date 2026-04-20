"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useState } from "react";
import { Eye, Lock, RefreshCw, BookOpen } from "lucide-react";
import Image from "next/image";
import type { Book } from "@/app/data/books";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Detect whether a URL points to a PDF (vs an image preview).
 * The backend can return either — covers/previews uploaded as PNG/JPG
 * are images, while previews uploaded as PDF are documents.
 */
function isPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url, "http://localhost").pathname;
    return pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

export function PreviewViewer({ book }: { book: Book }) {
  // Coerce — the legacy Book type uses `String` (wrapper) not `string` (primitive).
  const previewUrl: string | null = book.pdfPreviewUrl ? String(book.pdfPreviewUrl) : null;
  const isPdf = previewUrl ? isPdfUrl(previewUrl) : false;

  // For PDFs we still blob-fetch for the light DRM layer. For images
  // we can render directly since they're just a teaser, not the full content.
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!previewUrl && isPdf);
  const [error, setError] = useState(false);

  // PDF blob fetch — runs once on mount if preview is a PDF.
  useState(() => {
    if (!previewUrl || !isPdf) return;
    let active = true;
    let url: string | null = null;

    fetch(previewUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load preview PDF");
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (!active) return;
        url = URL.createObjectURL(new Blob([buf]));
        setBlobUrl(url);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  });

  // ── No preview at all ───────────────────────────────────────
  if (!previewUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
            Preview
          </h2>
        </div>
        <div className="relative glass-card overflow-hidden">
          <div className="flex flex-col items-center justify-center h-80 gap-4 text-[var(--color-text-muted)]">
            <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                No Preview Available
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                This book does not have a preview
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Image preview (PNG, JPG, WebP) ──────────────────────────
  if (!isPdf) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
            Preview
          </h2>
        </div>
        <div className="relative glass-card overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #F8FAFC)" }}
          />
          <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[var(--color-text-body)]"
              style={{
                background: "#F8FAFC",
                border: "1px solid hsl(210 100% 52% / 0.3)",
              }}
            >
              <Lock className="w-3 h-3 text-amber-400" />
              Buy to unlock the full book
            </span>
          </div>
          <div className="flex justify-center bg-[var(--color-surface)]">
            <Image
              src={previewUrl}
              alt={`Preview of ${book.title}`}
              width={560}
              height={800}
              className="w-full max-w-[560px] h-auto object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>
    );
  }

  // ── PDF preview ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
          Free Preview — Page 1 of {book.pageCount}
        </h2>
      </div>

      <div className="relative glass-card overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #F8FAFC)" }}
        />
        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
          <span
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[var(--color-text-body)]"
            style={{
              background: "#F8FAFC",
              border: "1px solid hsl(210 100% 52% / 0.3)",
            }}
          >
            <Lock className="w-3 h-3 text-amber-400" />
            {book.pageCount - 1} more pages locked — buy to unlock
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Loading preview...
              </p>
            </div>
          </div>
        ) : blobUrl ? (
          <div
            className="overflow-hidden select-none flex justify-center bg-[var(--color-surface)]"
            style={{ maxHeight: "600px" }}
          >
            <Document
              file={blobUrl}
              loading={
                <div className="flex flex-col items-center justify-center h-80 gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Loading preview...
                  </p>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-80 gap-4 text-[var(--color-text-muted)]">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                      Preview Unavailable
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      This book preview cannot be loaded at this time
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Try Again
                  </button>
                </div>
              }
            >
              <Page
                pageNumber={1}
                width={Math.min(
                  typeof window !== "undefined" ? window.innerWidth - 80 : 500,
                  560
                )}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-80 gap-4 text-[var(--color-text-muted)]">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                Preview Unavailable
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Could not load the preview file from the server
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 gap-4 text-[var(--color-text-muted)]">
            <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                No Preview Available
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                This book does not have a preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
