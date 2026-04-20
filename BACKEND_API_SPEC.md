# Backend API Spec — rebuild contract for the eBook Hub backend

This document is the authoritative contract the Next.js frontend (BFF
pattern) expects from the backend. Everything the frontend assumes
about shapes, endpoints, auth semantics, and behavior is listed here.
If any item is deliberately changed, the corresponding frontend code
must change alongside it.

Target base: `http://localhost:8080/ebook` in dev; the frontend reads
`process.env.BACKEND_URL` at runtime and refuses to boot in production
if it's unset.

---

## 1. Response envelope

Every JSON response is wrapped in a fixed envelope.

### 1.1 Success

```json
{
  "success": true,
  "message": "Book created successfully",
  "data": { ... }
}
```

- `success`: always `true` on 2xx responses
- `message`: short human-readable text; the frontend displays this raw in toasts on mutations, so keep it clean and user-appropriate
- `data`: payload, shape varies per endpoint (see section 7). May be `null` for endpoints that acknowledge but return no data (e.g. delete)

### 1.2 Error

```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired refresh token"
}
```

- `status`: matches the HTTP status code
- `error`: short machine-readable code (uppercase, snake-case or single word)
- `message`: human-readable; FE surfaces this to the user for non-catastrophic errors

The FE normalizes errors to domain classes by HTTP status:

| Status | FE error class | Notes |
|---|---|---|
| 400 | `BadRequestError` | bad input |
| 401 | `UnauthorizedError` | triggers the refresh-retry path |
| 403 | `ForbiddenError` | authenticated but not allowed |
| 404 | `NotFoundError` | |
| 409 | `ConflictError` | e.g. duplicate email on register, duplicate book title |
| 422 | `ValidationError` | backend may also include per-field errors (format TBD, FE does not currently read them) |
| 429 | `RateLimitError` | **must** include `Retry-After` header in seconds |
| 5xx | `ServerError` | |

### 1.3 Rate limit header

On 429 responses the backend must send `Retry-After: <seconds>`. The FE
parses it and shows the user when they can retry. Missing header → FE
falls back to a generic "try again later" toast.

---

## 2. Authentication & token lifecycle

### 2.1 JWT access token

The access token is a standard JWT with these claims:

```json
{
  "iss": "...",
  "sub": "<user-uuid>",
  "upn": "<email>",
  "groups": ["ADMIN", "AUTHOR"],
  "userType": "READER" | "AUTHOR",
  "sessionId": "<session-uuid>",
  "exp": 1700000000
}
```

- `exp` is unix seconds (standard)
- `userType` must be one of `READER` | `AUTHOR`
- `groups` is the role array — `ADMIN` is a privileged group
- The FE **decodes without verifying**; it trusts signature enforcement on the backend. The FE reads only `exp`, `sub`, `userType`, `groups`, `upn`

### 2.2 Token TTLs

- **Access token**: 15 minutes (`expiresIn: 900` in seconds)
- **Refresh token**: 7 days

These values are duplicated into the FE's cookie max-age; any change
requires updating `server/auth/auth.cookies.ts` and `proxy.ts`.

### 2.3 Refresh rotation

On every successful `POST /auth/refresh`, the backend **must**:

1. Invalidate the old refresh token
2. Issue a new refresh token
3. Issue a new access token
4. Return BOTH in the response body

The FE relies on rotation; no sliding-expiry or stay-the-same refresh
tokens. The FE has single-flight protection so a single user won't
race its own refreshes, but rotation is still required for security.

### 2.4 Device fingerprint

The FE generates a fingerprint server-side (in Next.js Edge runtime)
from `user-agent | accept-language | IP`, persists it in the
`ebook_device_fp` cookie, and sends it on both login and refresh:

```json
{
  "email": "...", "password": "...", "deviceFingerprint": "bff-abc123"
}
```

Backend is free to validate / bind sessions to fingerprint or ignore
it. The FE sends it unconditionally.

### 2.5 Where tokens live

Tokens are carried as `Authorization: Bearer <accessToken>` on every
authenticated request. The FE stores tokens in HttpOnly cookies
(`ebook_access_token`, `ebook_refresh_token`) and never exposes them to
the browser JS. Login and refresh responses carry tokens in the JSON
body; the FE copies them into cookies.

**Backend must NOT set cookies directly.** The FE is the session owner.

### 2.6 Session invalidation

- `POST /auth/logout` → invalidates only the current session (identified by the refresh token in the body)
- `POST /auth/logout-all` → invalidates every session for the caller across all devices
- Password change, forgot/reset, and `logout-all` should revoke all refresh tokens for the user
- After a session is revoked, any subsequent request carrying a token bound to that session must return 401 with `error: "UNAUTHORIZED"`

---

## 3. Pagination contract

### 3.1 Query parameters

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 0 | zero-based |
| `size` | integer | 20 | max 100; backend should clamp, not error |
| `sort` | string | varies per endpoint | format `field,dir` (e.g. `title,asc`); only whitelisted fields accepted per endpoint |

### 3.2 Paginated envelope

When any of `page`/`size`/`sort` is present, `data` is:

```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

### 3.3 Legacy unbounded mode

When **none** of `page`/`size`/`sort` are present on list endpoints
that historically returned arrays, `data` is the plain array `[ ... ]`.
This is how the FE currently consumes home-page lists, department
listings, and other public catalogs.

**Endpoints that must support legacy mode:**

- `GET /books`
- `GET /books/category/{id}`
- `GET /books/author/{id}`
- `GET /books/my`
- `GET /authors`
- `GET /categories`
- `GET /admin/books`
- `GET /admin/books/pending`
- `GET /admin/authors`
- `GET /categories/admin/all`

### 3.4 Always-paged endpoints

These endpoints **always** return the paged envelope, regardless of
whether `page`/`size` are present:

- `GET /payments/my`
- `GET /payments/my/books`

Defaults when unspecified: `page=0, size=20`.

### 3.5 Sort allow-lists

Backend must validate `sort` against a per-endpoint whitelist and
reject unknown fields with 400. Current FE usage:

| Endpoint | Allowed sort fields |
|---|---|
| `GET /books*` | `createdAt`, `title`, `price`, `publishedDate` |
| `GET /authors`, `GET /admin/authors` | `createdAt`, `firstName`, `lastName` |
| `GET /categories*` | `name`, `createdAt` |
| `GET /payments/my` | `createdAt`, `amount`, `status` |
| `GET /payments/my/books` | `accessGrantedAt`, `lastReadAt` |

---

## 4. Endpoint reference

Types below match `server/api/apiTypes.ts`. All paths are relative to
the base URL. Auth column: `public` = no token, `user` = any
authenticated user, `admin` = `ADMIN` in `groups`.

### 4.1 Auth (`/auth/*`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| POST | `/auth/register` | public | `RegisterRequest` | `RegisterResponse` |
| POST | `/auth/verify-email` | public | `{ "token": "..." }` | `null` |
| POST | `/auth/resend-verification` | public | `{ "email": "..." }` | `null` |
| POST | `/auth/login` | public | `LoginRequest` | `LoginResponse` |
| POST | `/auth/refresh` | public | `RefreshRequest` | `RefreshResponse` |
| POST | `/auth/forgot-password` | public | `{ "email": "..." }` | `null` — always 200 even if email unknown (enumeration protection) |
| POST | `/auth/reset-password` | public | `ResetPasswordRequest` | `null` |
| POST | `/auth/change-password` | user | `ChangePasswordRequest` | `null` — revokes all other sessions |
| POST | `/auth/logout` | user | `LogoutRequest` | `null` |
| POST | `/auth/logout-all` | user | `null` | `null` |
| GET | `/auth/me` | user | — | `UserResponse` |

Behavior notes:

- **Register** creates the user with `status: "PENDING"` and emails a verification token. Reader registration is self-serve; author accounts are created by admins only via `POST /admin/authors`.
- **Verify-email** flips `emailVerified: true` and user becomes usable. One-time token; reject on re-use.
- **Login** requires `emailVerified: true` for both readers and authors. Rejects locked/disabled users with 401 or 403.
- **Refresh** rotates (see 2.3). Body must carry the current refresh token and device fingerprint. Returns 401 with `error: "UNAUTHORIZED"` when token is invalid, revoked, or expired.
- **Forgot-password** must return success regardless of email existence.

### 4.2 User / profile (`/user/*`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/user/profile` | user | — | `UserProfile` |
| PUT | `/user/profile` | user | `UpdateProfileRequest` | `UserProfile` |

`UserProfile` is role-agnostic; author-only fields (`description`,
`designation`, `qualification`, `profileUrl`) are populated for
authors and null for readers. The FE also reads a legacy `imageUrl`
field as a fallback when `profileUrl` is null — rebuild should return
`profileUrl` only; `imageUrl` can be dropped in favor of always
setting `profileUrl`.

### 4.3 Categories (`/categories/*`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/categories` | public | — | `CategoryResponse[]` or `PagedResponse<CategoryResponse>` — **only active=true** |
| GET | `/categories/{id}` | public | — | `CategoryResponse` |
| GET | `/categories/admin/all` | admin | — | includes inactive |
| POST | `/categories` | admin | `CreateCategoryRequest` | `CategoryResponse` |
| PUT | `/categories/{id}` | admin | `UpdateCategoryRequest` | `CategoryResponse` |
| DELETE | `/categories/{id}` | admin | — | `null` — soft delete |
| PATCH | `/categories/{id}/toggle` | admin | — | `CategoryResponse` — flips `active` |

- Category name must be unique; 409 on conflict.
- `slug` is backend-generated from `name`.

### 4.4 Authors (`/authors`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/authors` | public | — | only active AND email-verified authors |

### 4.5 Books (`/books/*`)

Public reads:

| Method | Path | Auth | 200 data |
|---|---|---|---|
| GET | `/books` | public | APPROVED+published only |
| GET | `/books/{id}` | public | 404 if unpublished/missing |
| GET | `/books/category/{categoryId}` | public | APPROVED+published only |
| GET | `/books/author/{authorId}` | public | APPROVED+published only |

Author own-books:

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/books/my` | user | — | all statuses except DELETED |
| GET | `/books/my/{id}` | user | — | author must own the book |
| POST | `/books` | user | `CreateBookRequest` | created with `status: "PENDING"` |
| PUT | `/books/{id}` | user | `UpdateBookRequest` | see "status transitions" |
| DELETE | `/books/{id}` | user | — | soft delete, `status: "DELETED"` |
| GET | `/books/my/{id}/history` | user | — | `BookApprovalLogResponse[]` |

#### Status transitions on mutations

The FE relies on these invariants:

1. **Create** → `status = PENDING`, `isPublished = false`.
2. **Update — cosmetic fields only** (cover, keywords, version, pages, discount) → status unchanged. This is important: updating cosmetic fields on an APPROVED book must NOT re-queue it.
3. **Update — substantive fields** (title, description, price, categoryId, bookUrl, previewUrl) on an APPROVED book → `status = PENDING`, `isPublished = false`. The FE shows a "submitted for re-review" banner when it detects this transition.
4. **Approve** (admin) → `status = APPROVED`, `isPublished = true`.
5. **Reject** (admin) → `status = REJECTED`, `rejectionReason` populated.
6. **Delete** (author) → `status = DELETED`, hidden from `/books/my` default list.

#### Approval-log actions

`BookApprovalLogResponse.action` must be one of:
`SUBMITTED` | `RESUBMITTED` | `APPROVED` | `REJECTED` | `DELETION_REQUESTED`

### 4.6 Admin book moderation (`/admin/books/*`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/admin/books` | admin | — | all statuses |
| GET | `/admin/books/pending` | admin | — | status=PENDING only |
| GET | `/admin/books/{id}` | admin | — | `BookResponse` |
| PATCH | `/admin/books/{id}/approve` | admin | — | `BookResponse` — sets APPROVED + isPublished=true |
| PATCH | `/admin/books/{id}/reject` | admin | `RejectBookRequest` | `BookResponse` — sets REJECTED |
| GET | `/admin/books/{id}/history` | admin | — | `BookApprovalLogResponse[]` |

### 4.7 Admin authors (`/admin/authors/*`)

| Method | Path | Auth | Body | 200 data |
|---|---|---|---|---|
| GET | `/admin/authors` | admin | — | `AuthorResponse[]` or paged, includes inactive |
| GET | `/admin/authors/{id}` | admin | — | `AuthorResponse` |
| POST | `/admin/authors` | admin | `CreateAuthorRequest` | sends verification email automatically |
| PUT | `/admin/authors/{id}` | admin | `UpdateAuthorRequest` (no email) | `AuthorResponse` |
| DELETE | `/admin/authors/{id}` | admin | — | soft-deactivate (`active=false`) |
| PATCH | `/admin/authors/{id}/toggle` | admin | — | flips `active` |
| POST | `/admin/authors/{id}/resend-verification` | admin | — | `null` |

### 4.8 Cart (`/cart/*`) — all require user auth

| Method | Path | Body | 200 data |
|---|---|---|---|
| GET | `/cart` | — | `CartResponse` |
| POST | `/cart/items` | `AddCartItemRequest` | `CartItemResponse` — 409 if already in cart |
| DELETE | `/cart/items/{bookId}` | — | `null` |
| DELETE | `/cart` | — | `null` (clear cart) |
| POST | `/cart/checkout` | — | `CheckoutResponse` — requires `Idempotency-Key` header |

- Checkout must consume the `Idempotency-Key` header. Same key within a short window (≥10 minutes) must return the **same** `CheckoutResponse`, not create a duplicate payment.
- Checkout creates a Payment record, grants the user access to all cart books, empties the cart. All in one transaction.

### 4.9 Payments & library (`/payments/*`)

All require user auth.

| Method | Path | Body | 200 data |
|---|---|---|---|
| POST | `/payments/checkout` | `DirectCheckoutRequest` | `PaymentResponse` — direct "Buy Now", bypasses cart; requires `Idempotency-Key` |
| GET | `/payments/my` | — | **always paged** `PagedResponse<PaymentResponse>` |
| GET | `/payments/my/{id}` | — | `PaymentResponse` |
| GET | `/payments/my/books` | — | **always paged** `PagedResponse<UserBookResponse>` |

- Idempotency on both checkout paths (cart + direct).
- `PaymentStatus`: `CREATED` | `PENDING` | `SUCCESS` | `FAILED` | `REFUNDED`. Current mock flow always transitions to `SUCCESS`.
- Access grant happens synchronously at successful payment.

### 4.10 Uploads (`POST /uploads`) — multipart

Body (multipart/form-data):

- `file`: the binary
- `kind`: `cover` | `preview` | `book` | `profile`

Response (`UploadResponse`):

```json
{
  "url": "/ebook/files/covers/abc123.jpg",
  "key": "covers/abc123.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 384221,
  "kind": "cover"
}
```

- `url` is a **relative path** served by the backend at `/ebook/files/*`. The FE prepends the backend origin before handing it to the browser.
- The FE validates size/MIME client-side (see `features/uploads/uploadKindConfig.ts`). Backend must re-validate and reject anything out of spec.

Per-kind expectations:

| Kind | Allowed MIME | Max size (informational) |
|---|---|---|
| `cover` | image/jpeg, image/png, image/webp, image/gif | 5 MB |
| `preview` | image/*, application/pdf | 10 MB |
| `book` | application/pdf, application/epub+zip | 100 MB |
| `profile` | image/jpeg, image/png, image/webp, image/gif | 5 MB |

- Orphaned uploads (not referenced by any entity after 24h) should be GC'd. FE assumes this cleanup exists and feels free to upload optimistically before saving the owning form.

### 4.11 File serving (`GET /ebook/files/*`)

- Paths returned from `/uploads` and from entity fields (`coverUrl`, `previewUrl`, `bookUrl`, `profileUrl`) must be directly fetchable.
- Profile images and covers should be **public** (no auth) so they render in browser `<img>` without token juggling.
- Book files (`bookUrl`) should be **gated** — only the book's owner (or an admin) can fetch. The secure reader route passes the token when streaming.

---

## 5. Behavioral invariants the FE relies on

These are non-obvious contracts. Breaking any of these breaks a UI flow.

1. **Refresh rotation** — see 2.3.
2. **Book status auto-transitions on update** — see 4.5 status transitions.
3. **Public listings exclude inactive** — categories/authors with `active=false` don't show on public endpoints.
4. **Default category sort is `name`** in the FE's admin UI, not `createdAt`.
5. **Search and filters** — the FE currently does client-side filtering on `/books`. If backend ever adds server-side filters, the FE will adopt them but currently expects full-list responses on public book endpoints in legacy mode.
6. **Relative file paths** — the backend returns `/ebook/files/...` and the FE resolves to `<origin>/ebook/files/...`. Returning absolute URLs (e.g. CDN) also works — the FE passes them through unchanged if they start with `http://` or `https://`.
7. **Soft deletes** — delete endpoints never remove rows; they flip a flag. Lists exclude soft-deleted entries by default (admin-all endpoints may include them).
8. **Idempotency-Key** — both checkout paths use it. Window should be ≥10 min.
9. **Pagination page indexing is zero-based.**
10. **Cookies are NEVER set by the backend.** Tokens are always in JSON response bodies; the FE owns cookie lifecycle.
11. **Error `message` field is user-safe.** The FE surfaces it in toasts verbatim. Do not include stack traces, SQL text, or internal IDs.

---

## 6. Security requirements

1. **Rate limit** auth endpoints: login, register, forgot-password, reset-password, change-password, verify-email, resend-verification, refresh. Respond with 429 + `Retry-After` header.
2. **Password rules** — minimum 6 characters (FE validates; backend should also enforce, ideally stricter: min 8, complexity).
3. **Email enumeration prevention** on `forgot-password` and `register` — always return success on forgot-password; return generic 409 on register conflicts without disclosing whether email or verification state was the cause.
4. **JWT signing** — HS256 or RS256; backend controls the key. FE does not verify.
5. **Refresh token binding** — a refresh token should be bound to the session it was issued for. If device fingerprint is enforced, bind to that too.
6. **Admin authorization** — every `/admin/*` endpoint must re-check `ADMIN` in `groups` at the request layer; do not rely on the FE gating alone.
7. **Book file access** — `bookUrl` downloads must verify the caller owns the book (via a `UserBook` record) or is an admin. Return 403 otherwise, 404 if the book doesn't exist.
8. **Upload safety** — validate MIME via sniffing (not just extension), reject executables, sanitize filenames before storage.
9. **CORS** — the FE is same-origin with the BFF; the backend should only accept calls from the BFF origin, not from the browser directly.

---

## 7. Healthcheck and observability

- A `GET /ebook/health` endpoint returning `{ success: true, data: { status: "UP" } }` is nice-to-have; the FE doesn't currently hit it but ops should.
- Log every 401 / 429 / 5xx with request id, user id (if present), and a short error code.
- The FE does not currently send a request-id header but backend may emit one in responses for correlation.

---

## 8. Things the backend must NOT do

These are specific anti-patterns that will silently break the FE.

1. **Do not set auth cookies from the backend.** The FE owns the cookie jar.
2. **Do not rotate on read.** Only `/auth/refresh` should rotate tokens. Any other endpoint rotating tokens on success will break the FE's refresh flow and cause logout loops.
3. **Do not return `403` when a refresh token is expired/revoked.** Use `401` — the FE's interceptor is keyed on 401 to trigger refresh-retry. A 403 skips that path and goes straight to "access denied."
4. **Do not gate public read endpoints behind auth.** `/books`, `/books/{id}`, `/authors`, `/categories`, and their subpaths must work with no token at all. The FE calls them with `skipAuth: true`.
5. **Do not change envelope shape per endpoint.** `{ success, message, data }` on success, `{ status, error, message }` on error. Flat responses or custom shapes break the FE's normalizer.
6. **Do not send tokens in query strings or URLs.** Only `Authorization: Bearer` or the JSON body of refresh.
7. **Do not return 200 with `success: false`.** Use HTTP status codes. The FE trusts them.

---

## 9. Reference types (copy-paste from FE)

All DTO interfaces the FE uses are defined in
`server/api/apiTypes.ts`. The backend should mirror every shape
listed there. If a field is added or renamed, coordinate with the FE
maintainer — search the repo for the field name to find every call
site.

Critical shapes to match 1:1:

- `BookResponse`, `CreateBookRequest`, `UpdateBookRequest`
- `AuthorResponse`, `CreateAuthorRequest`, `UpdateAuthorRequest`
- `CategoryResponse`
- `PaymentResponse`, `PaymentItemResponse`, `UserBookResponse`
- `CartResponse`, `CartItemResponse`, `CheckoutResponse`
- `UploadResponse`
- `LoginResponse`, `RefreshResponse`, `RegisterResponse`, `UserProfile`
- `BookApprovalLogResponse`

The FE's TypeScript types are the single source of truth for what
fields must exist and whether they're nullable. Look at the `| null`
vs optional `?` distinction — they mean different things:

- `field: string | null` — key always present, value is either string or null
- `field?: string` — key may be omitted entirely

Backend serialization must honor this distinction (Jackson default:
use `@JsonInclude(Include.ALWAYS)` for `| null` fields so the key is
always present; `@JsonInclude(Include.NON_NULL)` for optional `?`).

---

## 10. Minimum endpoint set to unblock the FE

If you need to ship incrementally, this is the priority order:

1. **Auth core** — register, verify-email, login, refresh, logout, `/auth/me`. Without these, nothing works.
2. **Profile** — GET / PUT `/user/profile`. Every dashboard page reads this.
3. **Categories + Books public reads** — home page needs them to render anything.
4. **Uploads** — needed before book create / profile image save.
5. **Books CRUD** — author flow (create, update, my-list, my-detail, delete, history).
6. **Cart + Checkout + Payments/my/books** — purchase flow.
7. **Admin moderation** — approve, reject, authors CRUD, categories CRUD.
8. **Pagination** — add once the unpaginated versions work. Legacy mode is FE-compatible; paging can be added without breaking anything.
9. **Password flows + resend-verification** — recovery paths.

---

## Changelog

Any change to this document should be reflected in a coordinated PR
that updates both the backend implementation and the FE types /
services. The FE treats this spec as the ground truth and will reject
backend responses that don't match.
