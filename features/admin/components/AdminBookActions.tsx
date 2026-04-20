"use client";

/**
 * Approve / Reject controls for the admin book moderation detail page.
 *
 * Reject opens an inline reason form (no modal — keeps focus on the
 * book context). The action enforces a non-empty reason so the author
 * gets actionable feedback.
 *
 * After a successful approve/reject the page re-renders via
 * revalidatePath inside the action, so the new status pill appears
 * without a manual refresh.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ChevronLeft } from "lucide-react";
import type { BookStatus } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";
import {
  approveBookAction,
  rejectBookAction,
} from "@/features/admin/actions/admin-books.action";

export function AdminBookActions({
  bookId,
  status,
}: {
  bookId: string;
  status: BookStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  const isFinalised = status === "APPROVED" || status === "DELETED";
  const busy = approving || rejecting;

  const handleApprove = () => {
    setApproveConfirmOpen(true);
  };

  const handleConfirmApprove = () => {
    startApprove(async () => {
      const result = await approveBookAction(bookId);
      if (!result.success) {
        toast.error(result.message);
        setApproveConfirmOpen(false);
        return;
      }
      toast.success(result.message);
      setApproveConfirmOpen(false);
      router.refresh();
    });
  };

  const handleReject = () => {
    startReject(async () => {
      const result = await rejectBookAction(bookId, reason);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setShowReject(false);
      setReason("");
      router.refresh();
    });
  };

  if (isFinalised) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-xs text-[var(--color-text-muted)] font-semibold">
          {status === "APPROVED"
            ? "This book is approved and visible in the public catalog."
            : "This book has been deleted."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showReject ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Approve & publish
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--color-error)] bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--color-error)] flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejection reason
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              The author will see this on their edit page so they know
              what to fix.
            </p>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. The cover image isn't high-resolution enough — please re-upload at 1200px or larger."
            className="w-full px-4 py-3 rounded-xl bg-white border border-red-200 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)] resize-none leading-relaxed"
            autoFocus
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={busy || !reason.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-error)] hover:bg-red-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
            >
              {rejecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Send rejection
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleConfirmApprove}
        tone="info"
        title="Approve and publish this book?"
        description="It will become publicly visible in the catalog immediately."
        confirmLabel="Approve & publish"
        pendingLabel="Approving…"
        pending={approving}
      />
    </div>
  );
}
