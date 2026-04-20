/**
 * Central endpoint registry — single source of truth.
 *
 * Rules:
 *  1. No logic, no imports — pure string constants.
 *  2. Grouped by domain so each group can later point at a
 *     different microservice base URL.
 *  3. Functions accept typed params to build dynamic paths.
 */

const DEFAULT_BASE = "http://localhost:8080/ebook";
const BASE = process.env.BACKEND_URL ?? DEFAULT_BASE;

// Production safety: refuse to silently point at localhost in prod.
// Skipped during `next build` (NEXT_PHASE === "phase-production-build")
// so CI builds don't require the runtime backend URL to be set. At
// actual runtime this throws on module load of the first handler that
// imports routes — fails loud, fast, and before any request can be
// served with the wrong origin.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.BACKEND_URL
) {
  throw new Error(
    "BACKEND_URL is required in production — refusing to fall back to localhost."
  );
}

// ─── Auth ────────────────────────────────────────────────────
export const AUTH_ROUTES = {
  register: `${BASE}/auth/register`,
  verifyEmail: `${BASE}/auth/verify-email`,
  resendVerification: `${BASE}/auth/resend-verification`,
  login: `${BASE}/auth/login`,
  refresh: `${BASE}/auth/refresh`,
  forgotPassword: `${BASE}/auth/forgot-password`,
  resetPassword: `${BASE}/auth/reset-password`,
  changePassword: `${BASE}/auth/change-password`,
  logout: `${BASE}/auth/logout`,
  logoutAll: `${BASE}/auth/logout-all`,
  me: `${BASE}/auth/me`,
} as const;

// ─── User / Profile ─────────────────────────────────────────
export const USER_ROUTES = {
  profile: `${BASE}/user/profile`,
  updateProfile: `${BASE}/user/profile`,
} as const;

// ─── Categories ─────────────────────────────────────────────
export const CATEGORY_ROUTES = {
  list: `${BASE}/categories`,
  detail: (id: string) => `${BASE}/categories/${id}`,
  /** ADMIN — includes inactive */
  adminList: `${BASE}/categories/admin/all`,
  create: `${BASE}/categories`,
  update: (id: string) => `${BASE}/categories/${id}`,
  remove: (id: string) => `${BASE}/categories/${id}`,
  toggle: (id: string) => `${BASE}/categories/${id}/toggle`,
} as const;

// ─── Authors (public) ───────────────────────────────────────
export const AUTHOR_ROUTES = {
  list: `${BASE}/authors`,
} as const;

// ─── Books ──────────────────────────────────────────────────
export const BOOK_ROUTES = {
  // Public
  list: `${BASE}/books`,
  detail: (id: string) => `${BASE}/books/${id}`,
  byCategory: (categoryId: string) => `${BASE}/books/category/${categoryId}`,
  byAuthor: (authorId: string) => `${BASE}/books/author/${authorId}`,

  // Author-only (own books)
  myList: `${BASE}/books/my`,
  myDetail: (id: string) => `${BASE}/books/my/${id}`,
  myHistory: (id: string) => `${BASE}/books/my/${id}/history`,
  create: `${BASE}/books`,
  update: (id: string) => `${BASE}/books/${id}`,
  remove: (id: string) => `${BASE}/books/${id}`,
} as const;

// ─── Cart ───────────────────────────────────────────────────
export const CART_ROUTES = {
  get: `${BASE}/cart`,
  addItem: `${BASE}/cart/items`,
  removeItem: (bookId: string) => `${BASE}/cart/items/${bookId}`,
  clear: `${BASE}/cart`,
  checkout: `${BASE}/cart/checkout`,
} as const;

// ─── Payments / Library ─────────────────────────────────────
export const PAYMENT_ROUTES = {
  /** Direct "Buy Now" — bypasses the cart. */
  checkout: `${BASE}/payments/checkout`,
  /** Caller's purchase history (always paged). */
  myList: `${BASE}/payments/my`,
  myDetail: (id: string) => `${BASE}/payments/my/${id}`,
  /** Caller's purchased-book library (always paged). */
  myBooks: `${BASE}/payments/my/books`,
} as const;

// ─── Uploads ────────────────────────────────────────────────
export const UPLOAD_ROUTES = {
  /** Multipart — returns a `UploadResponse`. See "File Upload & Storage". */
  create: `${BASE}/uploads`,
} as const;

// ─── Admin ──────────────────────────────────────────────────
export const ADMIN_ROUTES = {
  // Authors
  authorsList: `${BASE}/admin/authors`,
  authorDetail: (id: string) => `${BASE}/admin/authors/${id}`,
  authorCreate: `${BASE}/admin/authors`,
  authorUpdate: (id: string) => `${BASE}/admin/authors/${id}`,
  authorDelete: (id: string) => `${BASE}/admin/authors/${id}`,
  authorToggle: (id: string) => `${BASE}/admin/authors/${id}/toggle`,
  authorResendVerification: (id: string) =>
    `${BASE}/admin/authors/${id}/resend-verification`,

  // Book moderation
  booksList: `${BASE}/admin/books`,
  booksPending: `${BASE}/admin/books/pending`,
  bookDetail: (id: string) => `${BASE}/admin/books/${id}`,
  bookApprove: (id: string) => `${BASE}/admin/books/${id}/approve`,
  bookReject: (id: string) => `${BASE}/admin/books/${id}/reject`,
  bookHistory: (id: string) => `${BASE}/admin/books/${id}/history`,
} as const;

// ─── Aggregate export ────────────────────────────────────────
export const API_ROUTES = {
  auth: AUTH_ROUTES,
  user: USER_ROUTES,
  category: CATEGORY_ROUTES,
  author: AUTHOR_ROUTES,
  book: BOOK_ROUTES,
  cart: CART_ROUTES,
  payment: PAYMENT_ROUTES,
  upload: UPLOAD_ROUTES,
  admin: ADMIN_ROUTES,
} as const;

// ─── Query helpers ──────────────────────────────────────────
/**
 * Appends a `URLSearchParams`-style query string to a route. Falsy
 * values are skipped so callers can pass sparse objects:
 *
 *   withQuery(BOOK_ROUTES.list, { page: 0, size: 20, sort: undefined })
 *   → "http://.../books?page=0&size=20"
 */
export function withQuery(
  url: string,
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}
