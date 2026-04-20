import "server-only";

/**
 * Uploads service — the single `POST /uploads` endpoint behind every
 * file upload flow in the app (book cover, preview, PDF/EPUB, profile
 * image). Returns a `{ url, key, ... }` response the caller then passes
 * as a string field when creating/updating the owning entity.
 *
 * Caller responsibilities:
 *  - Validate MIME + size client-side against UPLOAD_KIND_CONFIG so the
 *    user sees the error before the network round-trip.
 *  - Call this from a Server Action (interceptor reads cookies).
 */

import { apiClient } from "../api/apiClient";
import { UPLOAD_ROUTES } from "../api/apiRoutes";
import type { ApiResult, UploadKind, UploadResponse } from "../api/apiTypes";

export const uploadsService = {
  /**
   * Upload a file for the given `kind`. Always multipart.
   *
   * The backend cleans up orphaned uploads (not referenced by any
   * entity row) after 24h, so it's safe to upload optimistically and
   * abandon the form.
   */
  async upload(
    file: File,
    kind: UploadKind
  ): Promise<ApiResult<UploadResponse>> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    return apiClient<UploadResponse>(UPLOAD_ROUTES.create, {
      method: "POST",
      body: form,
    });
  },
};
