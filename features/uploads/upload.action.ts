"use server";

/**
 * Thin Server Action around `uploadsService.upload`.
 *
 * Why a Server Action and not a direct fetch from the client?
 *  - The interceptor reads HttpOnly auth cookies. A client `fetch` to
 *    the BFF would need a browser-facing route that re-exposes them,
 *    or we'd have to accept tokens in headers (bad).
 *  - Server Actions give us transparent refresh-retry on 401 via the
 *    interceptor, matching every other mutation in the app.
 *
 * The caller (a client component form field) passes a FormData with:
 *   - file: File
 *   - kind: UploadKind
 *
 * Returns a narrow success/failure object the client can render
 * without pulling in server-only types.
 */

import { uploadsService } from "@/server/catalog/uploads.service";
import type { UploadKind, UploadResponse } from "@/server/api/apiTypes";
import { ApiError } from "@/server/api/errors";
import { resolveFileUrl } from "@/lib/resolve-file-url";

export type UploadActionResult =
  | { success: true; data: UploadResponse }
  | { success: false; message: string };

export async function uploadFileAction(
  formData: FormData
): Promise<UploadActionResult> {
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return { success: false, message: "Missing file" };
  }
  if (typeof kind !== "string") {
    return { success: false, message: "Missing upload kind" };
  }

  try {
    const result = await uploadsService.upload(file, kind as UploadKind);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    // Backend returns relative paths (e.g. "/ebook/files/profiles/abc.jpg").
    // Resolve to an absolute URL so the browser can render the preview
    // against the backend origin, not the Next.js origin.
    const url = resolveFileUrl(result.data.url) ?? result.data.url;
    return { success: true, data: { ...result.data, url } };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Upload failed — please try again",
    };
  }
}
