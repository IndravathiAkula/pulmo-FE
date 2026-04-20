import {
  CircleDot,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  History,
  type LucideIcon,
} from "lucide-react";
import type {
  BookApprovalAction,
  BookApprovalLogResponse,
} from "@/server/api/apiTypes";
import { EmptyState } from "@/client/ui/feedback/EmptyState";

/**
 * Vertical timeline of approval-log entries — used on both the author
 * book history page and (later) the admin moderation detail page.
 *
 * Each action gets its own colored dot/icon so the eye can scan the
 * timeline for approvals (green) vs. rejections (red) at a glance.
 */

const ACTION_CONFIG: Record<
  BookApprovalAction,
  { label: string; icon: LucideIcon; bg: string; fg: string }
> = {
  SUBMITTED: {
    label: "Submitted for review",
    icon: CircleDot,
    bg: "var(--color-primary-light)",
    fg: "var(--color-primary)",
  },
  RESUBMITTED: {
    label: "Re-submitted",
    icon: RefreshCcw,
    bg: "var(--color-sky-light)",
    fg: "var(--color-blue-500)",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "var(--color-accent-light)",
    fg: "var(--color-accent-hover)",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "#FEE2E2",
    fg: "var(--color-error)",
  },
  DELETION_REQUESTED: {
    label: "Deletion requested",
    icon: Trash2,
    bg: "var(--color-surface-alt)",
    fg: "var(--color-text-muted)",
  },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalHistoryTimeline({
  entries,
}: {
  entries: BookApprovalLogResponse[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No approval history yet"
        description="Submissions, approvals, rejections, and deletion requests will appear here as they happen."
        tone="inline"
      />
    );
  }

  // Newest first reads better in a timeline.
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ol className="relative">
      {/* Vertical rail */}
      <div
        aria-hidden="true"
        className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--color-border)]"
      />

      {sorted.map((entry, idx) => {
        const config = ACTION_CONFIG[entry.action];
        const Icon = config.icon;
        return (
          <li
            key={entry.id}
            className={`relative flex gap-4 ${idx === sorted.length - 1 ? "" : "pb-6"}`}
          >
            <div
              className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white"
              style={{ backgroundColor: config.bg, color: config.fg }}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-bold text-[var(--color-text-main)]">
                  {config.label}
                </p>
                <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                <span className="font-semibold">{entry.senderEmail}</span>
                {entry.receiverEmail && entry.receiverEmail !== entry.senderEmail && (
                  <>
                    {" → "}
                    <span className="font-semibold">{entry.receiverEmail}</span>
                  </>
                )}
              </p>

              {entry.message && (
                <p className="mt-2 text-sm text-[var(--color-text-body)] leading-relaxed bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2">
                  {entry.message}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
