import {
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { BookStatus } from "@/server/api/apiTypes";

/**
 * Status pill aligned with the agreed color tokens:
 *   PENDING  → peach
 *   APPROVED → accent (green)
 *   REJECTED → error (red)
 *   DELETED  → muted grey
 */
const STATUS_CONFIG: Record<
  BookStatus,
  { label: string; icon: LucideIcon; bg: string; fg: string; border: string }
> = {
  PENDING: {
    label: "Pending review",
    icon: Clock,
    bg: "var(--color-peach-light)",
    fg: "var(--color-peach-deep)",
    border: "rgba(249, 168, 88, 0.35)",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "var(--color-accent-light)",
    fg: "var(--color-accent-hover)",
    border: "rgba(34, 197, 94, 0.35)",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "#FEE2E2",
    fg: "var(--color-error)",
    border: "rgba(220, 38, 38, 0.30)",
  },
  DELETED: {
    label: "Deleted",
    icon: Trash2,
    bg: "var(--color-surface-alt)",
    fg: "var(--color-text-muted)",
    border: "var(--color-border)",
  },
};

export function BookStatusPill({
  status,
  size = "md",
}: {
  status: BookStatus;
  size?: "sm" | "md";
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClass =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${sizeClass}`}
      style={{
        backgroundColor: config.bg,
        color: config.fg,
        borderColor: config.border,
      }}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}
