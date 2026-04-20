"use client";

/**
 * AuthorRow — single author entry with toggle / resend / edit / delete.
 *
 * Each action mutates server state then revalidates `/dashboard/admin/authors`,
 * so the parent server component re-renders with fresh data on the next
 * navigation tick. Local pending states keep the buttons honest while
 * the action is in flight.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Pencil,
  Mail,
  Power,
  PowerOff,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import type { AuthorResponse } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";
import {
  toggleAuthorAction,
  resendAuthorVerificationAction,
  deleteAuthorAction,
} from "@/features/admin/actions/admin-authors.action";

interface AuthorRowProps {
  author: AuthorResponse;
  /**
   * Fired when the Edit button is clicked. The parent owns the edit
   * modal state and is responsible for showing the form pre-filled
   * with this author.
   */
  onEdit: (author: AuthorResponse) => void;
}

export function AuthorRow({ author, onEdit }: AuthorRowProps) {
  const router = useRouter();
  const toast = useToast();
  const [toggling, startToggle] = useTransition();
  const [resending, startResend] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = toggling || resending || deleting;

  const handleToggle = () => {
    startToggle(async () => {
      const result = await toggleAuthorAction(author.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      // Force a re-fetch of the parent route so the badge + button
      // label reflect the new isActive state immediately. The action
      // already revalidated the cache, but a manually-invoked Server
      // Action (not a <form action>) doesn't auto-refresh the route.
      router.refresh();
    });
  };

  const handleResend = () => {
    startResend(async () => {
      const result = await resendAuthorVerificationAction(author.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    startDelete(async () => {
      try {
        await deleteAuthorAction(author.id);
      } catch {
        // Server-side redirect throws — ignore.
      }
      setConfirmOpen(false);
    });
  };

  return (
    <li className="relative rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-border-hover)] hover:shadow-md transition-all p-4 sm:p-5">
      {/* Whole-card link → author details. Sits on top of the card so
          clicks anywhere navigate; the action buttons re-enable pointer
          events below so Edit/Resend/Toggle still work. */}
      <Link
        href={`/dashboard/admin/authors/${author.id}`}
        aria-label={`View details for ${author.firstName} ${author.lastName}`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
      />
      <div className="flex items-start gap-4 flex-wrap pointer-events-none">
        {/* Avatar — show profile image when available, initials fallback */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-md flex-shrink-0 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-start) 0%, var(--color-primary-end) 100%)",
          }}
        >
          {author.profileUrl ? (
            <Image
              src={author.profileUrl}
              alt={`${author.firstName} ${author.lastName}`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            (author.firstName.charAt(0) + author.lastName.charAt(0)).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[var(--color-text-main)] truncate">
                {author.firstName} {author.lastName}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3" />
                {author.email}
              </p>
              {author.designation && (
                <p className="text-xs text-[var(--color-text-body)] font-semibold mt-1 truncate">
                  {author.designation}
                </p>
              )}
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                tone={author.active ? "accent" : "muted"}
                icon={author.active ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
              >
                {author.active ? "Active" : "Inactive"}
              </Badge>
              <Badge
                tone={author.emailVerified ? "primary" : "peach"}
                icon={<CheckCircle2 className="w-3 h-3" />}
              >
                {author.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </div>

          {/* Actions — `pointer-events-auto` re-enables clicks so the
              buttons (edit modal, resend, toggle) still fire; everything
              else on the card falls through to the overlay link. */}
          <div className="relative z-10 pointer-events-auto flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => onEdit(author)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>

            {!author.emailVerified && (
              <button
                type="button"
                onClick={handleResend}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-body)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                Resend invite
              </button>
            )}

            {/* Toggle: button color reflects the action it WILL perform.
                Green chip when currently inactive (clicking will activate),
                peach/warning when currently active (clicking will deactivate). */}
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              title={
                author.active
                  ? "Deactivate this author"
                  : "Activate this author"
              }
              className={
                author.active
                  ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-peach-deep)] bg-[var(--color-peach-light)] border border-[rgba(249,168,88,0.30)] hover:bg-[var(--color-peach-deep)] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[rgba(34,197,94,0.30)] hover:bg-[var(--color-accent-hover)] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              }
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : author.active ? (
                <PowerOff className="w-3.5 h-3.5" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              {author.active ? "Deactivate" : "Activate"}
            </button>

            {/* <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button> */}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        tone="warning"
        title={`Deactivate ${author.firstName} ${author.lastName}?`}
        description="This is a soft delete — the author can be reactivated later."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        pending={deleting}
      />
    </li>
  );
}

function Badge({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "peach" | "muted";
}) {
  const toneMap = {
    primary: {
      bg: "var(--color-primary-light)",
      fg: "var(--color-primary)",
      border: "rgba(30, 58, 95, 0.20)",
    },
    accent: {
      bg: "var(--color-accent-light)",
      fg: "var(--color-accent-hover)",
      border: "rgba(34, 197, 94, 0.30)",
    },
    peach: {
      bg: "var(--color-peach-light)",
      fg: "var(--color-peach-deep)",
      border: "rgba(249, 168, 88, 0.35)",
    },
    muted: {
      bg: "var(--color-surface-alt)",
      fg: "var(--color-text-muted)",
      border: "var(--color-border)",
    },
  } as const;
  const styles = toneMap[tone];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: styles.bg,
        color: styles.fg,
        borderColor: styles.border,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
