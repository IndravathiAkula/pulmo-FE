/**
 * Typed contracts matching the backend response envelope.
 *
 * Every server-side function returns `ApiResult<T>` — a
 * discriminated union the caller destructures without guessing.
 */

// ─── Backend envelope (matches exactly) ──────────────────────
export interface BackendSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface BackendErrorResponse {
  status: number;
  error: string;
  message: string;
}

// ─── Pagination envelope ─────────────────────────────────────
/**
 * Opt-in pagination envelope the backend wraps list responses in when
 * the client sends any of `page` / `size` / `sort` query params.
 *
 * When those params are omitted the backend returns a plain `T[]` — see
 * the API doc "Pagination Contract". Endpoints that are always paged
 * (e.g. `/payments/my`, `/payments/my/books`) always return this shape.
 */
export interface PagedResponse<T> {
  content: T[];
  /** Zero-based page index. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Query parameters shared by every paged list endpoint. `page` is
 * zero-based; `sort` follows the Spring Data "field,direction" format
 * and is allow-listed per endpoint by the backend.
 *
 * Service methods treat this as opt-in: calling without arguments keeps
 * the unbounded legacy-array response; passing any fields switches the
 * endpoint into paged mode and the service returns `PagedResponse<T>`.
 */
export interface PagedQuery {
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Internal normalised result ──────────────────────────────
export type ApiResult<T> =
  | { ok: true; data: T; message: string }
  | { ok: false; error: ApiErrorPayload };

export interface ApiErrorPayload {
  status: number;
  code: string;
  message: string;
}

// ─── Request options ─────────────────────────────────────────
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip attaching access token (e.g. login, register) */
  skipAuth?: boolean;
  /** Skip auto-retry on 401 (used internally to prevent loops) */
  skipRetry?: boolean;
}

// ─── Auth domain DTOs (match backend exactly) ────────────────

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: "READER" | "AUTHOR";
}

export interface RegisterResponse {
  id: string;
  email: string;
  userType: "READER" | "AUTHOR";
  status: string;
  roles: string[];
  createdAt: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
  deviceFingerprint: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LogoutRequest {
  refreshToken: string;
  deviceFingerprint: string;
}

// ─── /auth/me ────────────────────────────────────────────────
/** GET /auth/me — same shape as register response. */
export type UserResponse = RegisterResponse;

// ─── User / Profile DTOs ────────────────────────────────────

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  interests: string | null;
  /** Present on AUTHOR profiles; absent/ignored for READER. */
  imageUrl?: string | null;
  /** Author-only: long-form bio shown on the profile page. */
  description?: string | null;
  /** Author-only: professional title (e.g. "Senior Pulmonologist"). */
  designation?: string | null;
  /** Author-only: academic / professional qualifications (e.g. "MBBS, MD"). */
  qualification?: string | null;
  /** Backend-persisted URL of the profile image (from POST /uploads, kind=profile). */
  profileUrl?: string | null;
  userType?: "READER" | "AUTHOR";
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  interests?: string;
  /** Author-only fields — ignored by the backend for READER users. */
  imageUrl?: string;
  description?: string;
  designation?: string;
  qualification?: string;
  /** Pre-uploaded profile image URL (from POST /uploads, kind=profile). */
  profileUrl?: string;
}

// ─── Category DTOs ───────────────────────────────────────────

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Backend field is `active` (Jackson serializes Java `boolean active` via `isActive()` getter as JSON `active`). */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

// ─── Author DTOs ─────────────────────────────────────────────

export interface AuthorResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  designation: string | null;
  description: string | null;
  qualification: string | null;
  profileUrl: string | null;
  emailVerified: boolean;
  /** Backend field is `active` (Jackson serializes Java `boolean active` via `isActive()` getter as JSON `active`). */
  active: boolean;
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthorRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designation?: string;
  description?: string;
  qualification?: string;
  /** Pre-uploaded profile image URL (from POST /uploads, kind=profile). */
  profileUrl?: string;
}

/** UpdateAuthorRequest is CreateAuthorRequest minus email (per spec). */
export type UpdateAuthorRequest = Omit<CreateAuthorRequest, "email">;

// ─── Book DTOs ───────────────────────────────────────────────

export type BookStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";

export type BookApprovalAction =
  | "SUBMITTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "DELETION_REQUESTED";

export interface BookResponse {
  id: string;
  title: string;
  description: string | null;
  price: number;
  discount: number | null;
  keywords: string | null;
  publishedDate: string | null;
  pages: number | null;
  coverUrl: string | null;
  previewUrl: string | null;
  /** Signed/public URL of the uploaded PDF/EPUB. `null` until uploaded. */
  bookUrl: string | null;
  versionNumber: string | null;
  isPublished: boolean;
  status: BookStatus;
  rejectionReason: string | null;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookRequest {
  title: string;
  description?: string;
  price: number;
  discount?: number;
  keywords?: string;
  pages?: number;
  coverUrl?: string;
  previewUrl?: string;
  /** Pre-uploaded PDF/EPUB URL (from POST /uploads, kind=book). */
  bookUrl?: string;
  versionNumber?: string;
  categoryId: string;
}

/** UpdateBookRequest = CreateBookRequest + optional `message` to admin. */
export interface UpdateBookRequest extends CreateBookRequest {
  message?: string;
}

export interface RejectBookRequest {
  reason?: string;
}

export interface BookApprovalLogResponse {
  id: string;
  bookId: string;
  bookTitle: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  receiverEmail: string;
  action: BookApprovalAction;
  message: string | null;
  createdAt: string;
}

// ─── Cart DTOs ───────────────────────────────────────────────

export interface CartItemResponse {
  bookId: string;
  title: string;
  authorName: string;
  categoryName: string;
  coverUrl: string | null;
  price: number;
  discount: number | null;
  effectivePrice: number;
  addedAt: string;
}

export interface CartResponse {
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
}

export interface AddCartItemRequest {
  bookId: string;
}

export interface CheckoutResponse {
  paymentId: string;
  totalAmount: number;
  itemsPurchased: number;
  /** Mock checkout always lands on `SUCCESS`; the other values exist for future gateways. */
  status: "SUCCESS" | "FAILED" | "PENDING";
}

// ─── Payment / Library DTOs ──────────────────────────────────

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

/** A single book a user has purchased — one row of the `/payments/my/books` page. */
export interface UserBookResponse {
  bookId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  bookUrl: string | null;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  pricePaid: number;
  discount: number | null;
  accessGrantedAt: string;
  lastReadAt: string | null;
  progressPercentage: number;
}

/** Line item inside a `PaymentResponse`. */
export interface PaymentItemResponse {
  bookId: string;
  title: string;
  coverUrl: string | null;
  authorName: string;
  price: number;
  discount: number | null;
  effectivePrice: number;
}

export interface PaymentResponse {
  paymentId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  items: PaymentItemResponse[];
}

/** Body for POST /payments/checkout (direct Buy Now). */
export interface DirectCheckoutRequest {
  bookIds: string[];
}

// ─── Upload DTOs ─────────────────────────────────────────────

export type UploadKind = "cover" | "preview" | "book" | "profile";

export interface UploadResponse {
  url: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  kind: UploadKind;
}

// ─── Token types ─────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** JWT claims decoded from the access token */
export interface JwtClaims {
  iss: string;
  sub: string;
  upn: string;
  groups: string[];
  userType: "READER" | "AUTHOR";
  sessionId: string;
  exp: number;
}
