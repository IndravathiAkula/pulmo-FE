// ─── PDF Service ──────────────────────────────────────────────────────────
// Abstracts PDF URL resolution away from UI components.
// The reader never touches `book.pdfUrl` directly — it always calls this service.
//
// SECURITY NOTE:
// In production, this function should call a backend endpoint that:
//   1. Validates the user's JWT
//   2. Confirms the purchase record in the database
//   3. Returns a short-lived signed URL (e.g. S3 pre-signed URL, 5min TTL)
// The frontend should NEVER hold a permanent, guessable PDF URL.
// Current mock returns the static path for development only.

export interface PdfResolveOptions {
    /** 'preview': only first page should be shown. 'full': all pages. */
    mode: 'preview' | 'full';
    userId?: string;
    bookId: string;
}

export interface ResolvedPdf {
    url: string;
    /** Maximum pages to render (1 for preview, Infinity for full) */
    maxPages: number;
}

/**
 * Resolves the PDF resource for a given book and access level.
 * Replace this with an API call in production.
 */
export async function resolvePdf(
    pdfUrl: string,
    options: PdfResolveOptions
): Promise<ResolvedPdf> {
    // Simulate network latency of a real token fetch
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
        url: pdfUrl,
        maxPages: options.mode === 'preview' ? 1 : Infinity,
    };
}
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Reads the PDF file from the local filesystem and returns a buffer.
 * In production, this might stream from S3 or another cloud storage.
 */
export async function getPdfBuffer(pdfUrl: string): Promise<Buffer> {
    const filePath = path.join(process.cwd(), 'public', pdfUrl);
    return await readFile(filePath);
}
