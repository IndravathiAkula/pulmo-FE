"use client";

/**
 * ConfirmDialog — themed replacement for window.confirm().
 *
 * Built on top of Modal so it inherits the application's backdrop,
 * focus management, scroll-lock, and Escape-to-close behaviour.
 *
 * Tones:
 *   danger  — irreversible destructive actions (hard delete, clear cart)
 *   warning — reversible risky actions (soft-deactivate, soft-delete)
 *   info    — non-destructive confirmations (publish, approve)
 *
 * The `pending` prop disables both buttons and prevents backdrop/Escape
 * dismissal while the action is in flight. Callers own the async work
 * and close the dialog once it settles.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   const [pending, start] = useTransition();
 *
 *   <ConfirmDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={() => start(async () => { await doThing(); setOpen(false); })}
 *     tone="danger"
 *     title='Delete "War and Peace"?'
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     pending={pending}
 *   />
 */

import type { ReactNode } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "./Modal";

type ConfirmTone = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Short sentence(s) under the title — plain string or rich node. */
  description?: ReactNode;
  confirmLabel?: string;
  /** Shown on the confirm button while `pending` is true. */
  pendingLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Disables buttons + suppresses backdrop/Escape dismissal while async work runs. */
  pending?: boolean;
}

const TONE_CONFIG: Record<
  ConfirmTone,
  {
    icon: LucideIcon;
    iconBg: string;
    iconFg: string;
    confirmBg: string;
    confirmBgHover: string;
  }
> = {
  danger: {
    icon: AlertOctagon,
    iconBg: "#FEE2E2",
    iconFg: "var(--color-error)",
    confirmBg: "var(--color-error)",
    confirmBgHover: "#B91C1C", // red-700
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "var(--color-peach-light)",
    iconFg: "var(--color-peach-deep)",
    confirmBg: "var(--color-peach-deep)",
    confirmBgHover: "var(--color-peach-deeper, var(--color-peach-deep))",
  },
  info: {
    icon: Info,
    iconBg: "var(--color-primary-light)",
    iconFg: "var(--color-primary)",
    confirmBg: "var(--color-primary)",
    confirmBgHover: "var(--color-primary-hover)",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
}: ConfirmDialogProps) {
  const config = TONE_CONFIG[tone];
  const Icon = config.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!pending}
      closeOnEscape={!pending}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
            style={{
              backgroundColor: config.confirmBg,
            }}
            onMouseEnter={(e) => {
              if (!pending)
                e.currentTarget.style.backgroundColor = config.confirmBgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = config.confirmBg;
            }}
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {pendingLabel ?? `${confirmLabel}…`}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.iconBg, color: config.iconFg }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
        {description ? (
          <div className="text-sm text-[var(--color-text-body)] leading-relaxed pt-1">
            {description}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
