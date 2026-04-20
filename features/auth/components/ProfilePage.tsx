"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Phone,
  BookOpen,
  Pencil,
  X,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Briefcase,
  FileText,
  GraduationCap,
} from "lucide-react";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/features/auth/actions/profile.action";
import { logoutAllAction } from "@/features/auth/actions/logout.action";
import { useActionStateToast } from "@/client/ui/feedback/ToastProvider";
import { FileUpload } from "@/features/uploads/components/FileUpload";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";

interface ProfilePageProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    interests: string;
    profileUrl?: string;
    description?: string;
    designation?: string;
    qualification?: string;
  };
  userType: "READER" | "AUTHOR";
}

const initialState: UpdateProfileActionState = {
  success: false,
  message: "",
};

export function ProfilePage({ user, userType }: ProfilePageProps) {
  const isAuthor = userType === "AUTHOR";
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  useActionStateToast(state);

  // Logout-all confirmation: prevent accidental sign-out of every session.
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [logoutAllPending, startLogoutAll] = useTransition();
  const handleConfirmLogoutAll = () => {
    startLogoutAll(async () => {
      await logoutAllAction();
    });
  };

  // ── Tracked form state for dirty-checking ──────────────────
  const initialValues = useMemo(
    () => ({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      interests: user.interests,
      designation: user.designation ?? "",
      qualification: user.qualification ?? "",
      description: user.description ?? "",
      profileUrl: user.profileUrl ?? "",
    }),
    [user]
  );

  const [form, setForm] = useState(initialValues);

  const handleStartEdit = () => {
    setForm(initialValues);
    setIsEditing(true);
  };

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialValues),
    [form, initialValues]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const avatarUrl = user.profileUrl || null;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const errors = state.errors ?? {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
    <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
     
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          My Profile 
          </h1>
  
        </div>

      </header>
      {/* ══════════════════════════════════════════════════════
          PROFILE HEADER — avatar + name + edit button
          ══════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-start) 0%, var(--color-primary-end) 100%)",
            }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              initials || <User className="w-8 h-8" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-bold text-[var(--color-text-main)] truncate pt-4">
              {fullName || "Welcome"}
            </h1>
            {isAuthor && user.designation && (
              <p className="text-sm text-[var(--color-primary)] font-medium mt-0.5">
                {user.designation}
              </p>
            )}
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{user.email}</p>
          </div>

       
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROFILE DETAILS — view or edit mode
          ══════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-xl border border-[var(--color-border)]">
        {isEditing ? (
          /* ── EDIT MODE ─────────────────────────────────── */
          <form
            action={(formData: FormData) => {
              action(formData);
              setIsEditing(false);
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-bold text-[var(--color-text-main)]">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="First Name" name="firstName" required
                  value={form.firstName} onChange={handleChange}
                  error={errors.firstName} maxLength={100}
                />
                <FormField
                  label="Last Name" name="lastName" required
                  value={form.lastName} onChange={handleChange}
                  error={errors.lastName} maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Phone" name="phone" type="tel"
                  value={form.phone} onChange={handleChange}
                  error={errors.phone} placeholder="+91 12345 67890"
                  icon={<Phone className="w-4 h-4" />}
                />
                <FormField
                  label="Interests" name="interests"
                  value={form.interests} onChange={handleChange}
                  placeholder="e.g. Cardiology, Research"
                  icon={<BookOpen className="w-4 h-4" />}
                />
              </div>

              {/* Author-only fields */}
              {isAuthor && (
                <>
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                      Author Details
                    </p>
                    <div className="space-y-4">
                      <FileUpload
                        kind="profile"
                        name="profileUrl"
                        label="Profile Photo"
                        hint="JPG, PNG, WebP, or GIF — square images work best"
                        initialUrl={user.profileUrl ?? null}
                        onUploaded={(url) => setForm((p) => ({ ...p, profileUrl: url }))}
                        onCleared={() => setForm((p) => ({ ...p, profileUrl: "" }))}
                        disabled={pending}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Designation" name="designation"
                          value={form.designation} onChange={handleChange}
                          error={errors.designation} maxLength={200}
                          placeholder="e.g. Senior Pulmonologist"
                          icon={<Briefcase className="w-4 h-4" />}
                        />
                        <FormField
                          label="Qualification" name="qualification"
                          value={form.qualification} onChange={handleChange}
                          error={errors.qualification} maxLength={200}
                          placeholder="e.g. MBBS, MD"
                          icon={<GraduationCap className="w-4 h-4" />}
                          showCounter
                        />
                      </div>

                      <FormField
                        label="Bio" name="description" as="textarea"
                        value={form.description} onChange={handleChange}
                        error={errors.description} maxLength={1000}
                        placeholder="A short bio — expertise, notable work, areas of interest…"
                        icon={<FileText className="w-4 h-4" />}
                        showCounter
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/50">
              <button
                type="submit"
                disabled={!isDirty || pending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {pending ? "Updating…" : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-semibold text-[var(--color-text-body)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                Cancel
              </button>
              {!isDirty && (
                <span className="text-xs text-[var(--color-text-muted)] ml-2">No changes</span>
              )}
            </div>
          </form>
        ) : (
          /* ── VIEW MODE ─────────────────────────────────── */
          <>
<div className="px-6 py-4 border-b border-[var(--color-border)] mx-auto flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--color-text-main)]">Personal Information</h2>
                 {/* Edit button */}
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-orange)] bg-white border border-[var(--color-orange)] hover:bg-[var(--color-orange)] hover:text-white rounded-lg transition-colors flex-shrink-0"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
            </div>

            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="First Name" value={user.firstName} />
                <InfoRow label="Last Name" value={user.lastName} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Phone" value={user.phone} />
                <div className="sm:col-span-2">
                  <InfoRow label="Interests" value={user.interests} />
                </div>

                {isAuthor && (
                  <>
                    <div className="sm:col-span-2 pt-4 border-t border-[var(--color-border)]">
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                        Author Details
                      </p>
                    </div>
                    <InfoRow label="Designation" value={user.designation} />
                    <InfoRow label="Qualification" value={user.qualification} />
                    <div className="sm:col-span-2">
                      <InfoRow label="Bio" value={user.description} multiline />
                    </div>
                  </>
                )}
              </dl>
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          ACCOUNT SECURITY
          ══════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
            Account Security
          </h2>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          <Link
            href="/change-password"
            className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface)] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-main)]">Change Password</p>
              <p className="text-xs text-[var(--color-text-muted)]">Update your account password</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => setLogoutAllOpen(true)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors group text-left"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 text-[var(--color-error)] group-hover:bg-red-100 transition-colors flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-error)]">Logout from All Devices</p>
              <p className="text-xs text-[var(--color-error)]/70">Revoke every active session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-error)]/40 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={logoutAllOpen}
        onClose={() => setLogoutAllOpen(false)}
        onConfirm={handleConfirmLogoutAll}
        tone="danger"
        title="Sign out from all devices?"
        description="This will sign you out from all active sessions on all devices. You’ll need to log in again to regain access."
        confirmLabel="Yes"
        pendingLabel="Logging out…"
        cancelLabel="Cancel"
        pending={logoutAllPending}
      />
    </div>
  );
}

/* ── View-mode info row ────────────────────────────────────── */

function InfoRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  const display = value?.trim() || "—";
  const isEmpty = !value?.trim();

  return (
    <div>
      <dt className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm ${
          isEmpty
            ? "text-[var(--color-text-muted)] italic"
            : "text-[var(--color-text-main)] font-medium"
        } ${multiline ? "whitespace-pre-line leading-relaxed" : "truncate"}`}
      >
        {display}
      </dd>
    </div>
  );
}

/* ── Edit-mode form field ──────────────────────────────────── */

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  as = "input",
  required,
  maxLength,
  placeholder,
  icon,
  showCounter,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  type?: string;
  as?: "input" | "textarea";
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  icon?: React.ReactNode;
  showCounter?: boolean;
}) {
  const inputClass = `w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 rounded-lg bg-white border text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all ${
    error ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"
  }`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={name} className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
        {showCounter && maxLength && (
          <span className="text-[10px] font-semibold tabular-nums text-[var(--color-text-muted)]">
            {value.length} / {maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {icon && (
          <span className={`absolute left-3 ${as === "textarea" ? "top-3" : "top-1/2 -translate-y-1/2"} w-4 h-4 text-[var(--color-text-light)] pointer-events-none`}>
            {icon}
          </span>
        )}
        {as === "textarea" ? (
          <textarea
            id={name} name={name} value={value} onChange={onChange}
            required={required} maxLength={maxLength} placeholder={placeholder}
            rows={4}
            className={`${inputClass} resize-none leading-relaxed`}
          />
        ) : (
          <input
            id={name} name={name} type={type} value={value} onChange={onChange}
            required={required} maxLength={maxLength} placeholder={placeholder}
            className={inputClass}
          />
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
