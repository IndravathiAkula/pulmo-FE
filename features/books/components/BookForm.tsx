"use client";

/**
 * BookForm — shared create/edit form for an author's book.
 *
 * Cover image, preview, and the book file (PDF/EPUB) all flow through
 * Pattern B: each FileUpload calls `POST /uploads` on pick, gets back
 * a URL, and writes that URL into a hidden `<input name="...">` the
 * form reads on submit. No multipart on this form — submits stay JSON.
 *
 * On success:
 *   - create → toast + router.push to /dashboard/books (My Books list)
 *   - edit   → toast; if the API flipped the book back to PENDING
 *              (substantive-field diff on an APPROVED book) we also
 *              render a re-review banner.
 */

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Save,
  Send,
  BookOpen,
  Tag,
  DollarSign,
  Hash,
  FileText,
  Layers,
  Clock,
} from "lucide-react";
import type {
  BookResponse,
  CategoryResponse,
} from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import {
  createBookAction,
  updateBookAction,
  type BookActionState,
} from "@/features/books/actions/book.action";
import { FileUpload } from "@/features/uploads/components/FileUpload";
import { BookStatusPill } from "./BookStatusPill";

interface BookFormProps {
  mode: "create" | "edit";
  categories: CategoryResponse[];
  /** Required when mode === "edit". */
  book?: BookResponse;
}

const initialState: BookActionState = { success: false, message: "" };

export function BookForm({ mode, categories, book }: BookFormProps) {
  const router = useRouter();
  const toast = useToast();

  const action =
    mode === "create"
      ? createBookAction
      : updateBookAction.bind(null, book?.id ?? "");

  const [state, dispatch, pending] = useActionState(action, initialState);

  // Capture the book's status at mount so we can detect the
  // APPROVED → PENDING re-review transition after a save. The ref is
  // only read on state changes; it never triggers a re-render itself.
  const initialStatusRef = useRef(book?.status);
  const [showReReviewBanner, setShowReReviewBanner] = useState(false);

  // Toast on every settled state and route on create success.
  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      if (mode === "create") {
        router.push("/dashboard/books");
      }
      // Re-review banner: the backend flips an APPROVED book back to
      // PENDING when a "substantive" field changed (title, description,
      // price, categoryId, bookUrl, previewUrl). We surface that as a
      // banner so the author knows the book is temporarily unpublished.
      if (
        mode === "edit" &&
        initialStatusRef.current === "APPROVED" &&
        book?.status === "PENDING" &&
        book.isPublished === false
      ) {
        setShowReReviewBanner(true);
        // Update the ref so a subsequent save on this (now-PENDING)
        // book doesn't re-trigger the banner.
        initialStatusRef.current = "PENDING";
      }
    } else if (!state.errors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors = state.errors ?? {};
  const submitLabel = mode === "create" ? "Submit for Review" : "Update Book";
  const SubmitIcon = mode === "create" ? Send : Save;

  // ── Tracked form state (both modes) ─────────────────────────
  // Always controlled so HTML5 validation, char counters, and the
  // dirty-check work uniformly. Create mode is always "dirty" (the
  // form has to be submitted); edit mode disables the button until
  // the user actually changes something.
  const initialValues = useMemo(
    () => ({
      title: book?.title ?? "",
      categoryId: book?.categoryId ?? "",
      description: book?.description ?? "",
      price: book ? String(book.price) : "",
      discount: book?.discount != null ? String(book.discount) : "",
      pages: book?.pages != null ? String(book.pages) : "",
      versionNumber: book?.versionNumber ?? "",
      keywords: book?.keywords ?? "",
      coverUrl: book?.coverUrl ?? "",
      previewUrl: book?.previewUrl ?? "",
      bookUrl: book?.bookUrl ?? "",
    }),
    [book]
  );

  const [form, setForm] = useState(initialValues);

  const isDirty = useMemo(() => {
    if (mode === "create") return true;
    return JSON.stringify(form) !== JSON.stringify(initialValues);
  }, [form, initialValues, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form action={dispatch} className="space-y-6">
      {/* Re-review banner — surfaces the backend's diff-based status
          flip (APPROVED → PENDING) after a substantive edit. */}
      {showReReviewBanner && (
        <div
          className="rounded-2xl border p-5 flex items-start gap-3"
          style={{
            backgroundColor: "var(--color-peach-light)",
            borderColor: "rgba(249, 168, 88, 0.35)",
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-[var(--color-peach-deep)] flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-peach-deep)]">
              Edit submitted for re-review
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-body)] mt-1 leading-relaxed">
              Your changes included a substantive field (title, description,
              price, category, book file, or preview), so the book is now
              unpublished pending admin review. Cosmetic edits (cover,
              keywords, version, pages, discount) don&apos;t trigger this.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReReviewBanner(false)}
            aria-label="Dismiss"
            className="p-1.5 rounded-lg text-[var(--color-peach-deep)] hover:bg-white/60 transition-colors flex-shrink-0"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rejection notice — only relevant on edit mode for rejected books */}
      {mode === "edit" &&
        book?.status === "REJECTED" &&
        book.rejectionReason && (
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: "#FEF2F2",
              borderColor: "rgba(220, 38, 38, 0.30)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-[var(--color-error)] flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-error)]">
                  Rejected by admin
                </p>
                <p className="text-sm font-semibold text-[var(--color-text-body)] mt-1 leading-relaxed">
                  {book.rejectionReason}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Address the feedback below — saving will resubmit the
                  book for review.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Status banner on edit */}
      {mode === "edit" && book && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-[var(--color-primary)] flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Current Status
              </p>
              <p className="text-sm font-bold text-[var(--color-text-main)] truncate">
                {book.title}
              </p>
            </div>
          </div>
          <BookStatusPill status={book.status} />
        </div>
      )}

      {/* ── Identity ── */}
      <Section title="Book Details" subtitle="The essentials shown on the catalog">
        <Field
          name="title"
          label="Title"
          required
          maxLength={200}
          icon={<BookOpen className="w-4 h-4" />}
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="e.g. Respiratory Physiology in Practice"
        />

        <Field
          name="categoryId"
          label="Category"
          required
          icon={<Tag className="w-4 h-4" />}
          error={errors.categoryId}
          as="select"
          value={form.categoryId}
          onChange={handleChange}
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Field>

        <Field
          name="description"
          label="Description"
          as="textarea"
          rows={5}
          maxLength={5000}
          icon={<FileText className="w-4 h-4" />}
          value={form.description}
          onChange={handleChange}
          error={errors.description}
          placeholder="Short overview of the book's contents and audience…"
        />
      </Section>

      {/* ── Pricing & metadata ── */}
      <Section title="Pricing & Metadata">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            name="price"
            label="Price (USD)"
            required
            type="number"
            step="0.01"
            min="0"
            icon={<DollarSign className="w-4 h-4" />}
            value={form.price}
            onChange={handleChange}
            error={errors.price}
          />
          <Field
            name="discount"
            label="Discount (USD)"
            type="number"
            step="0.01"
            min="0"
            icon={<DollarSign className="w-4 h-4" />}
            value={form.discount}
            onChange={handleChange}
            error={errors.discount}
          />
          <Field
            name="pages"
            label="Pages"
            type="number"
            step="1"
            min="1"
            icon={<Hash className="w-4 h-4" />}
            value={form.pages}
            onChange={handleChange}
            error={errors.pages}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            name="versionNumber"
            label="Version"
            icon={<Layers className="w-4 h-4" />}
            value={form.versionNumber}
            onChange={handleChange}
            error={errors.versionNumber}
            placeholder="1.0.0"
          />
          <Field
            name="keywords"
            label="Keywords"
            icon={<Tag className="w-4 h-4" />}
            value={form.keywords}
            onChange={handleChange}
            placeholder="lung, respiration, MCQ, exit exam"
          />
        </div>
      </Section>

      {/* ── Files ── */}
      <Section
        title="Files"
        subtitle="Upload the cover image, an optional preview, and the full book file"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            kind="cover"
            name="coverUrl"
            label="Cover image"
            hint="JPG, PNG, WebP, or GIF"
            initialUrl={book?.coverUrl ?? null}
            onUploaded={(url) => setForm((p) => ({ ...p, coverUrl: url }))}
            onCleared={() => setForm((p) => ({ ...p, coverUrl: "" }))}
            disabled={pending}
          />
          <FileUpload
            kind="preview"
            name="previewUrl"
            label="Preview (optional)"
            hint="PDF or sample image"
            initialUrl={book?.previewUrl ?? null}
            onUploaded={(url) => setForm((p) => ({ ...p, previewUrl: url }))}
            onCleared={() => setForm((p) => ({ ...p, previewUrl: "" }))}
            disabled={pending}
          />
        </div>

        <FileUpload
          kind="book"
          name="bookUrl"
          label="Book file (PDF or EPUB)"
          hint="The full book — readers open this in the secure reader"
          required={mode === "create"}
          initialUrl={book?.bookUrl ?? null}
          onUploaded={(url) => setForm((p) => ({ ...p, bookUrl: url }))}
          onCleared={() => setForm((p) => ({ ...p, bookUrl: "" }))}
          disabled={pending}
        />

        {errors.bookUrl && (
          <p className="text-xs text-[var(--color-error)] flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" />
            {errors.bookUrl}
          </p>
        )}
      </Section>

      {/* ── Note to admin (edit only) ── */}
      {mode === "edit" && (
        <Section title="Note to Admin" subtitle="Optional — included with this re-submission">
          <Field
            name="message"
            label="Message"
            as="textarea"
            rows={3}
            icon={<FileText className="w-4 h-4" />}
            placeholder="What changed since last submission?"
          />
        </Section>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!isDirty || pending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "create" ? "Submitting…" : "Updating…"}
            </>
          ) : (
            <>
              <SubmitIcon className="w-4 h-4" />
              {submitLabel}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard/books")}
          disabled={pending}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)] transition-all"
        >
          Cancel
        </button>

        {mode === "edit" && !isDirty && (
          <p className="ml-auto text-xs text-[var(--color-text-muted)] italic">
            No changes to update
          </p>
        )}
        {mode === "edit" && isDirty && (
          <p className="ml-auto text-xs text-[var(--color-text-muted)]">
            Cosmetic edits save instantly; changes to title, description,
            price, category, book file, or preview re-trigger admin review.
          </p>
        )}
      </div>
    </form>
  );
}

/* ── Internal helpers ─────────────────────────────────────── */

function Section({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--color-text-main)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {badge}
      </header>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  /** Controlled value — preferred over defaultValue. */
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  as?: "input" | "textarea" | "select";
  rows?: number;
  children?: React.ReactNode;
}

function Field({
  name,
  label,
  required = false,
  type = "text",
  step,
  min,
  value,
  defaultValue,
  onChange,
  maxLength,
  placeholder,
  error,
  icon,
  as = "input",
  rows = 4,
  children,
}: FieldProps) {
  const baseInput =
    "w-full pr-4 py-3 rounded-xl bg-white border text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm";
  const padLeft = icon ? "pl-10" : "pl-4";
  const borderClass = error
    ? "border-[var(--color-error)]/40"
    : "border-[var(--color-border)]";
  const showCounter = maxLength && value !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={name}
          className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
        {showCounter && <CharCounter value={value} max={maxLength} />}
      </div>

      <div className="relative">
        {icon && (
          <span
            className={`absolute left-3.5 ${
              as === "textarea" ? "top-3.5" : "top-1/2 -translate-y-1/2"
            } w-4 h-4 text-[var(--color-text-light)] pointer-events-none`}
          >
            {icon}
          </span>
        )}

        {as === "textarea" ? (
          <textarea
            id={name}
            name={name}
            required={required}
            maxLength={maxLength}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`${baseInput} ${padLeft} ${borderClass} resize-none leading-relaxed`}
          />
        ) : as === "select" ? (
          <select
            id={name}
            name={name}
            required={required}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={onChange}
            className={`${baseInput} ${padLeft} ${borderClass} appearance-none`}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            required={required}
            maxLength={maxLength}
            step={step}
            min={min}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={onChange}
            placeholder={placeholder}
            className={`${baseInput} ${padLeft} ${borderClass}`}
          />
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[10px] font-semibold tabular-nums text-[var(--color-text-muted)]">
      {value.length} / {max}
    </span>
  );
}
