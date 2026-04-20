"use client";

/**
 * AuthorForm — shared create/edit form for an author profile.
 *
 * Email is editable only on create (the API spec disallows email change
 * on update). On create success the form resets so the admin can invite
 * another author without leaving the page.
 *
 * Edit mode tracks form state and disables the submit button until the
 * user actually changes something, preventing unnecessary API calls.
 */

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  UserPlus,
  Save,
  Mail,
  Phone,
  Briefcase,
  FileText,
  User,
  GraduationCap,
} from "lucide-react";
import type { AuthorResponse } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { FileUpload } from "@/features/uploads/components/FileUpload";
import {
  createAuthorAction,
  updateAuthorAction,
  type AdminAuthorActionState,
} from "@/features/admin/actions/admin-authors.action";

interface AuthorFormProps {
  mode: "create" | "edit";
  author?: AuthorResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: AdminAuthorActionState = { success: false, message: "" };

export function AuthorForm({ mode, author, onSuccess, onCancel }: AuthorFormProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const action =
    mode === "create"
      ? createAuthorAction
      : updateAuthorAction.bind(null, author?.id ?? "");

  const [state, dispatch, pending] = useActionState(action, initialState);

  // ── Tracked state + dirty-check ────────────────────────────
  const initialValues = useMemo(
    () => ({
      email: "",
      firstName: author?.firstName ?? "",
      lastName: author?.lastName ?? "",
      phone: author?.phone ?? "",
      designation: author?.designation ?? "",
      description: author?.description ?? "",
      qualification: author?.qualification ?? "",
      profileUrl: author?.profileUrl ?? "",
    }),
    [author]
  );

  const [form, setForm] = useState(initialValues);

  const isDirty = useMemo(() => {
    if (mode === "create") return true;
    return JSON.stringify(form) !== JSON.stringify(initialValues);
  }, [form, initialValues, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      if (mode === "create") {
        formRef.current?.reset();
        setForm(initialValues);
      }
      onSuccess?.();
    } else if (!state.errors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors = state.errors ?? {};
  const SubmitIcon = mode === "create" ? UserPlus : Save;

  return (
    <form ref={formRef} action={dispatch} className="space-y-4">
      {/* Email — only on create */}
      {mode === "create" && (
        <Field
          name="email"
          label="Email"
          required
          type="email"
          icon={<Mail className="w-4 h-4" />}
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="author@example.com"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          name="firstName"
          label="First name"
          required
          maxLength={100}
          icon={<User className="w-4 h-4" />}
          value={form.firstName}
          onChange={handleChange}
          error={errors.firstName}
        />
        <Field
          name="lastName"
          label="Last name"
          required
          maxLength={100}
          icon={<User className="w-4 h-4" />}
          value={form.lastName}
          onChange={handleChange}
          error={errors.lastName}
        />
      </div>

      <Field
        name="phone"
        label="Phone"
        type="tel"
        pattern="^\+?[\d\s\-()]{7,20}$"
        title="7–20 digits, optionally starting with +"
        icon={<Phone className="w-4 h-4" />}
        value={form.phone}
        onChange={handleChange}
        error={errors.phone}
        placeholder="+1 555 0100"
      />

      <Field
        name="designation"
        label="Designation"
        maxLength={200}
        icon={<Briefcase className="w-4 h-4" />}
        value={form.designation}
        onChange={handleChange}
        placeholder="e.g. Senior Pulmonologist"
      />

      <Field
        name="description"
        label="Bio"
        as="textarea"
        rows={4}
        maxLength={2000}
        icon={<FileText className="w-4 h-4" />}
        value={form.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Short bio shown on the author's public page…"
      />

      <Field
        name="qualification"
        label="Qualification"
        maxLength={200}
        icon={<GraduationCap className="w-4 h-4" />}
        value={form.qualification}
        onChange={handleChange}
        placeholder="e.g. MBBS, MD (Pulmonary Medicine)"
      />

      <FileUpload
        kind="profile"
        name="profileUrl"
        label="Profile photo (optional)"
        hint="JPG, PNG, WebP, or GIF — square images look best"
        initialUrl={author?.profileUrl ?? null}
        onUploaded={(url) => setForm((p) => ({ ...p, profileUrl: url }))}
        onCleared={() => setForm((p) => ({ ...p, profileUrl: "" }))}
        disabled={pending}
      />

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!isDirty || pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "create" ? "Inviting…" : "Updating…"}
            </>
          ) : (
            <>
              <SubmitIcon className="w-4 h-4" />
              {mode === "create" ? "Send invite" : "Update Author"}
            </>
          )}
        </button>

        {(onCancel || mode === "edit") && (
          <button
            type="button"
            onClick={() =>
              onCancel ? onCancel() : router.push("/dashboard/admin/authors")
            }
            disabled={pending}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)] transition-all"
          >
            Cancel
          </button>
        )}

        {mode === "create" && (
          <p className="text-xs text-[var(--color-text-muted)]">
            A verification email will be sent automatically.
          </p>
        )}
        {mode === "edit" && !isDirty && (
          <p className="text-xs text-[var(--color-text-muted)] italic">
            No changes to update
          </p>
        )}
      </div>
    </form>
  );
}

/* ── shared field control ────────────────────────────────────── */

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  pattern?: string;
  title?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  as?: "input" | "textarea";
  rows?: number;
}

function Field({
  name,
  label,
  required = false,
  type = "text",
  pattern,
  title,
  value,
  defaultValue,
  onChange,
  maxLength,
  placeholder,
  error,
  icon,
  as = "input",
  rows = 4,
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
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            required={required}
            maxLength={maxLength}
            pattern={pattern}
            title={title}
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
