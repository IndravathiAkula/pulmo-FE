"use client";

/**
 * CategoryRow — one row in the categories list.
 *
 * Edit and create both happen in modals owned by AdminCategoriesClient.
 * This row only renders the read-only summary + the per-row actions
 * (Edit → opens the parent modal, Toggle, Delete).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import type { CategoryResponse } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";
import {
  toggleCategoryAction,
  deleteCategoryAction,
} from "@/features/admin/actions/admin-categories.action";

interface CategoryRowProps {
  category: CategoryResponse;
  onEdit: (category: CategoryResponse) => void;
}

export function CategoryRow({ category, onEdit }: CategoryRowProps) {
  const router = useRouter();
  const toast = useToast();
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = toggling || deleting;

  const handleToggle = () => {
    startToggle(async () => {
      const result = await toggleCategoryAction(category.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      // Force re-fetch so the badge + button label update immediately.
      // revalidatePath in the action invalidates cache but doesn't
      // auto-refresh a manually-invoked Server Action's caller.
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    startDelete(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.success) {
        toast.error(result.message);
        setConfirmOpen(false);
        return;
      }
      toast.success(result.message);
      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <li className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-border-hover)] transition-colors p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="text-base font-extrabold text-[var(--color-text-main)] truncate">
              {category.name}
            </p>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              style={{
                backgroundColor: category.active
                  ? "var(--color-accent-light)"
                  : "var(--color-surface-alt)",
                color: category.active
                  ? "var(--color-accent-hover)"
                  : "var(--color-text-muted)",
                borderColor: category.active
                  ? "rgba(34, 197, 94, 0.30)"
                  : "var(--color-border)",
              }}
            >
              {category.active ? "Active" : "Inactive"}
            </span>
          </div>
          {/* <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">
            /{category.slug}
          </p> */}
          {category.description && (
            <p className="text-sm text-[var(--color-text-body)] mt-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(category)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>

          {/* Toggle: button color reflects the action it WILL perform —
              peach when currently active (clicking will deactivate),
              green when currently inactive (clicking will activate). */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            title={
              category.active
                ? "Deactivate this category"
                : "Activate this category"
            }
            aria-label={category.active ? "Deactivate" : "Activate"}
            className={
              category.active
                ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-peach-deep)] bg-[var(--color-peach-light)] border border-[rgba(249,168,88,0.30)] hover:bg-[var(--color-peach-deep)] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[rgba(34,197,94,0.30)] hover:bg-[var(--color-accent-hover)] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            }
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : category.active ? (
              <PowerOff className="w-3.5 h-3.5" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            {category.active ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={`Delete ${category.name}`}
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        tone="danger"
        title={`Delete "${category.name}"?`}
        description="Books already in this category will need to be reassigned. This cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleting}
      />
    </li>
  );
}
