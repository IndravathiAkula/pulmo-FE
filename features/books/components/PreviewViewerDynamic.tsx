"use client";

import { Book } from '@/app/data/books';
// PreviewViewerDynamic – Client wrapper that disables SSR for PreviewViewer.
//
// react-pdf (pdfjs-dist) executes `new DOMMatrix()` at module-evaluation time.
// DOMMatrix is a browser API; it does not exist in the Node.js SSR runtime,
// causing a ReferenceError crash. `ssr: false` prevents Next.js from importing
// or evaluating the module during server-side rendering.
//
// This wrapper MUST be a Client Component ("use client") — the docs explicitly
// state that `ssr: false` is not allowed in Server Components.

import dynamic from 'next/dynamic';
// import type { Book } from '../../data/books';

const PreviewViewer = dynamic(
  () => import('./PreviewViewer').then((m) => ({ default: m.PreviewViewer })),
  { ssr: false }
);

export function PreviewViewerDynamic({ book }: { book: Book }) {
  return <PreviewViewer book={book} />;
}
