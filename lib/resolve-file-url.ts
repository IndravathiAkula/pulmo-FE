/**
 * Resolve a backend file path to an absolute URL the browser can fetch.
 *
 * The backend stores uploaded files with paths like:
 *   "/ebook/files/covers/abc.jpg"      (leading slash, full path)
 *   "books/53b7-uuid.pdf"              (no leading slash, storage key only)
 *
 * External URLs ("https://cdn.example.com/cover.jpg") pass through unchanged.
 *
 * This helper is server-side-only because it reads `process.env.BACKEND_URL`.
 * Call it in Server Components or adapters BEFORE passing URLs to Client
 * Components so the resolved absolute URL is already in the serialized props.
 */

// Production safety: same contract as server/api/apiRoutes.ts — the
// real guard throws there. Here we just reuse the default for dev / build.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080/ebook";

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.BACKEND_URL
) {
  throw new Error(
    "BACKEND_URL is required in production — refusing to resolve file URLs against localhost."
  );
}

/**
 * Strip the `/ebook` suffix from the backend URL to get the bare origin
 * (e.g. "http://localhost:8080"). Handles BACKEND_URL with or without a
 * trailing `/ebook`.
 */
const BACKEND_ORIGIN = BACKEND_URL.replace(/\/ebook\/?$/, "");

/**
 * Resolve a file path from the backend to a full absolute URL.
 *
 * @param path — one of:
 *   - null / undefined / "" → returns null
 *   - absolute URL ("http://...", "https://...") → pass-through
 *   - path with leading "/" (e.g. "/ebook/files/covers/abc.jpg") → origin + path
 *   - bare storage key (e.g. "books/abc.pdf") → origin + "/ebook/files/" + key
 */
export function resolveFileUrl(
  path: string | null | undefined
): string | null {
  if (!path) return null;

  // Already absolute — external CDN or fully-qualified backend URL.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Path with leading slash — e.g. "/ebook/files/covers/abc.jpg".
  // Prepend just the origin.
  if (path.startsWith("/")) {
    return `${BACKEND_ORIGIN}${path}`;
  }

  // Bare storage key — e.g. "books/abc.pdf" or "covers/abc.jpg".
  // Prepend origin + the files serving base path.
  return `${BACKEND_ORIGIN}/ebook/files/${path}`;
}
