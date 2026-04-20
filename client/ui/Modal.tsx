"use client";

/**
 * Modal — application-wide dialog component.
 *
 * Behaviour:
 *  - Renders nothing when `open` is false.
 *  - Click on backdrop OR Escape key calls `onClose`.
 *  - Locks page scroll while open.
 *  - Auto-focuses the first focusable element in the dialog body so
 *    keyboard users can immediately interact.
 *  - Animates entry with the existing `animate-toast-in` keyframe so
 *    we don't introduce yet another animation token.
 *
 * Layout primitives:
 *  - Header takes a gradient strip (matches profile / cart / dashboard
 *    cards) and a close button.
 *  - Body slot is your form / content.
 *  - Optional footer slot for action rows; if you supply your own
 *    footer inside the body, just leave `footer` undefined.
 *
 * Sizes: sm (~360px), md (~520px), lg (~720px).
 */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Subtitle under the title — keep it short. */
  subtitle?: string;
  size?: ModalSize;
  /** Defaults to true. Set false to require an explicit close (e.g. mid-submit). */
  closeOnBackdrop?: boolean;
  /** Defaults to true. Set false during async submits. */
  closeOnEscape?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll lock + Escape handler (only while open).
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, closeOnEscape, onClose]);

  // Auto-focus first focusable element on open.
  useEffect(() => {
    if (!open) return;
    // Defer one tick so the dialog DOM has mounted.
    const id = window.setTimeout(() => {
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      );
      focusable?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative w-full ${SIZE_CLASS[size]} max-h-[calc(100vh-3rem)] flex flex-col bg-white rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-toast-in`}
      >
        {/* Header */}
        <header
          className="px-6 py-4 border-b border-[var(--color-border)] flex items-start justify-between gap-3"
          style={{
            background:
              "linear-gradient(135deg, #FFF8F0 0%, #FFECD2 50%, #E8EFF8 100%)",
          }}
        >
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-base font-extrabold text-[var(--color-text-main)] tracking-tight truncate"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/60 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Body — scrolls if content overflows. */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer — optional. */}
        {footer && (
          <footer className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 flex items-center justify-end gap-2 flex-wrap">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
