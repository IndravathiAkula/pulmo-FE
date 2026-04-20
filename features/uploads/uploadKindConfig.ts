/**
 * Per-kind validation rules for the upload pipeline.
 *
 * Mirrors the backend's validation matrix exactly — client-side checks
 * short-circuit the obvious errors (wrong MIME, oversize file) before
 * the network round-trip. The backend re-validates regardless, so
 * tampering here doesn't let a bad file through.
 *
 * Keep this file in sync with the "File Upload & Storage" section of
 * the API documentation.
 */

import type { UploadKind } from "@/server/api/apiTypes";

export interface UploadKindRules {
  /** Accepted MIME types. */
  mimeTypes: readonly string[];
  /** Max size in bytes. */
  maxBytes: number;
  /** Short human label (used in error messages and UI). */
  label: string;
  /** What to show in a file picker's `accept` attribute. */
  accept: string;
}

const MB = 1024 * 1024;

export const UPLOAD_KIND_CONFIG: Record<UploadKind, UploadKindRules> = {
  cover: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 2 * MB,
    label: "Cover image",
    accept: "image/jpeg,image/png,image/webp,image/gif",
  },
  preview: {
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxBytes: 5 * MB,
    label: "Preview",
    accept: "application/pdf,image/jpeg,image/png,image/webp",
  },
  book: {
    mimeTypes: ["application/pdf", "application/epub+zip"],
    maxBytes: 20 * MB,
    label: "Book file",
    accept: "application/pdf,application/epub+zip",
  },
  profile: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 2 * MB,
    label: "Profile image",
    accept: "image/jpeg,image/png,image/webp,image/gif",
  },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

/**
 * Validate a file against a kind's rules. Returns `null` on success
 * or a human-readable error message on failure.
 */
export function validateUpload(
  file: File,
  kind: UploadKind
): string | null {
  const rules = UPLOAD_KIND_CONFIG[kind];
  if (!rules.mimeTypes.includes(file.type)) {
    return `${rules.label} must be one of: ${rules.mimeTypes
      .map((m) => m.replace(/^.+\//, ""))
      .join(", ")}`;
  }
  if (file.size > rules.maxBytes) {
    return `${rules.label} exceeds the ${formatBytes(rules.maxBytes)} cap (got ${formatBytes(file.size)})`;
  }
  return null;
}
