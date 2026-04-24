"use client";

/**
 * FileUpload — shared file-picker-with-upload for every kind of file the
 * app uploads (book cover, preview, PDF/EPUB, profile image).
 *
 * Flow on user pick:
 *   1. Validate MIME + size client-side against UPLOAD_KIND_CONFIG.
 *   2. Call the `uploadFileAction` Server Action.
 *   3. On success, call `onUploaded(url)` so the parent form can stash
 *      the URL in its submit payload.
 *
 * The component is self-contained — it manages its own pending / error
 * state. The parent only needs to hand in `kind` + `onUploaded`.
 *
 * Accepts an optional `initialUrl` to render "Replace" UI on edit forms
 * (the file is already uploaded; user can still swap it).
 */

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import type { UploadKind } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { Modal } from "@/client/ui/Modal";
import {
  UPLOAD_KIND_CONFIG,
  formatBytes,
  validateUpload,
} from "@/features/uploads/uploadKindConfig";
import { uploadFileAction } from "@/features/uploads/upload.action";

interface FileUploadProps {
  kind: UploadKind;
  label: string;
  /** Short help text under the label. */
  hint?: string;
  /** Mark the field visually required (not enforced by this component). */
  required?: boolean;
  /** Current URL (edit mode) — renders a preview + "Replace" affordance. */
  initialUrl?: string | null;
  /**
   * When set, the component renders a hidden `<input name>` with the
   * current URL so a parent `<form>` picks it up on submit. Omit to
   * drive the value purely through `onUploaded`/`onCleared` callbacks.
   */
  name?: string;
  /** Fired with the new URL when an upload succeeds. */
  onUploaded?: (url: string) => void;
  /** Fired when the user clears the selection. Parent may null the URL. */
  onCleared?: () => void;
  /** Disable the picker (e.g. while the parent form is submitting). */
  disabled?: boolean;
  className?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; filename: string }
  | { kind: "uploaded"; url: string; filename?: string; isInitial?: boolean }
  | { kind: "error"; message: string };

const IMAGE_KINDS: readonly UploadKind[] = ["cover", "profile"];

export function FileUpload({
  kind,
  label,
  hint,
  required,
  initialUrl,
  name,
  onUploaded,
  onCleared,
  disabled,
  className = "",
}: FileUploadProps) {
  const rules = UPLOAD_KIND_CONFIG[kind];
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [status, setStatus] = useState<Status>(
    initialUrl
      ? { kind: "uploaded", url: initialUrl, isInitial: true }
      : { kind: "idle" }
  );
  const [oversizeWarning, setOversizeWarning] = useState<{
    filename: string;
    fileSize: number;
  } | null>(null);

  const handlePick = (file: File) => {
    const error = validateUpload(file, kind);
    if (error) {
      setStatus({ kind: "error", message: error.message });
      if (error.reason === "size") {
        setOversizeWarning({ filename: file.name, fileSize: file.size });
      } else {
        toast.error(error.message);
      }
      return;
    }

    setStatus({ kind: "uploading", filename: file.name });

    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    startTransition(async () => {
      const result = await uploadFileAction(form);
      if (!result.success) {
        setStatus({ kind: "error", message: result.message });
        toast.error(result.message);
        return;
      }
      setStatus({
        kind: "uploaded",
        url: result.data.url,
        filename: file.name,
      });
      toast.success(`${rules.label} uploaded`);
      onUploaded?.(result.data.url);
    });
  };

  const handleClear = () => {
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
    onCleared?.();
  };

  const isImage = IMAGE_KINDS.includes(kind);
  const showingPreview = status.kind === "uploaded" && status.url;
  const currentUrl = status.kind === "uploaded" ? status.url : "";
  const isDisabled = disabled || pending;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-[var(--color-text-body)]">
          {label}
          {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
        </label>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          Max {formatBytes(rules.maxBytes)}
        </span>
      </div>

      {/* Hidden form field — carries the uploaded URL to the parent
          form on submit. Empty string when no file is selected. */}
      {name && <input type="hidden" name={name} value={currentUrl} readOnly />}

      {/* Hidden native input — triggered by the big drop zone. */}
      <input
        ref={inputRef}
        type="file"
        accept={rules.accept}
        disabled={isDisabled}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePick(file);
        }}
      />

      {/* Drop zone / preview */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-colors overflow-hidden ${
          status.kind === "error"
            ? "border-[var(--color-error)]/40 bg-red-50/40"
            : showingPreview
              ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-light)]/30"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] hover:bg-white"
        }`}
      >
        {showingPreview && isImage ? (
          <div className="relative aspect-[3/4] w-full max-w-[180px] mx-auto my-4 rounded-xl overflow-hidden bg-white shadow-md">
            <Image
              src={status.url}
              alt={`${rules.label} preview`}
              width={180}
              height={240}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : showingPreview ? (
          <div className="flex items-center gap-3 p-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent-hover)] flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--color-text-main)] truncate">
                {(status.kind === "uploaded" && status.filename) ||
                  (status.kind === "uploaded" && status.isInitial ? "Current file" : "Uploaded file")}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {status.url}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isDisabled}
            className="w-full py-8 px-6 flex flex-col items-center justify-center gap-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
              {status.kind === "uploading" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : status.kind === "error" ? (
                <AlertCircle className="w-5 h-5 text-[var(--color-error)]" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text-main)]">
                {status.kind === "uploading"
                  ? `Uploading ${status.filename}…`
                  : status.kind === "error"
                    ? "Upload failed — try another file"
                    : "Click to choose a file"}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {hint ?? rules.mimeTypes.map((m) => m.split("/")[1]).join(", ")}
              </p>
            </div>
          </button>
        )}

        {/* Action overlay for the uploaded state */}
        {showingPreview && (
          <div className="flex items-center justify-center gap-2 px-4 pb-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isDisabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isDisabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
            {status.kind === "uploaded" && !status.isInitial && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-accent-hover)] ml-auto">
                <CheckCircle2 className="w-3 h-3" />
                Uploaded
              </span>
            )}
          </div>
        )}
      </div>

      {status.kind === "error" && (
        <p className="mt-1.5 text-xs text-[var(--color-error)] font-semibold">
          {status.message}
        </p>
      )}

      <Modal
        open={oversizeWarning !== null}
        onClose={() => setOversizeWarning(null)}
        title="File size exceeded"
        subtitle={`${rules.label} must be ${formatBytes(rules.maxBytes)} or smaller`}
        size="sm"
        footer={
          <button
            type="button"
            onClick={() => {
              setOversizeWarning(null);
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Choose another file
          </button>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-peach-light)] text-[var(--color-peach-deep)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 text-sm text-[var(--color-text-body)] leading-relaxed">
            <p className="font-semibold text-[var(--color-text-main)] break-words">
              {oversizeWarning?.filename}
            </p>
            <p className="mt-1">
              This file is{" "}
              <span className="font-bold text-[var(--color-error)]">
                {oversizeWarning ? formatBytes(oversizeWarning.fileSize) : ""}
              </span>
              , which is larger than the{" "}
              <span className="font-bold">
                {formatBytes(rules.maxBytes)}
              </span>{" "}
              limit. Please upload a smaller image.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
