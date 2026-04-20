"use client";

/**
 * CategoryForm — used both inline at the top of the categories page
 * (mode="create") and inside CategoryRow when a row enters edit mode
 * (mode="edit").
 *
 * Edit mode tracks form state and disables the submit button until
 * the user actually changes something, preventing unnecessary API calls.
 */

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, PlusCircle, Save, X } from "lucide-react";
import type { CategoryResponse } from "@/server/api/apiTypes";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import {
  createCategoryAction,
  updateCategoryAction,
  type AdminCategoryActionState,
} from "@/features/admin/actions/admin-categories.action";

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: CategoryResponse;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const initialState: AdminCategoryActionState = {
  success: false,
  message: "",
};

export function CategoryForm({
  mode,
  category,
  onCancel,
  onSuccess,
}: CategoryFormProps) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const action =
    mode === "create"
      ? createCategoryAction
      : updateCategoryAction.bind(null, category?.id ?? "");

  const [state, dispatch, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      if (mode === "create") {
        formRef.current?.reset();
        setForm({ name: "", description: "" });
      }
      onSuccess?.();
    } else if (!state.errors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Tracked state + dirty-check ────────────────────────────
  const initialValues = useMemo(
    () => ({
      name: category?.name ?? "",
      description: category?.description ?? "",
    }),
    [category]
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

  const errors = state.errors ?? {};

  return (
    <form ref={formRef} action={dispatch} className="space-y-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={`${mode}-name`}
              className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest"
            >
              Name <span className="text-[var(--color-error)]">*</span>
            </label>
            <CharCounter value={form.name} max={100} />
          </div>
          <input
            id={`${mode}-name`}
            name="name"
            required
            maxLength={100}
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Pulmonology"
            className={`w-full px-3 py-2.5 rounded-lg bg-white border text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all ${
              errors.name
                ? "border-[var(--color-error)]/40"
                : "border-[var(--color-border)]"
            }`}
          />
          {errors.name && (
            <p className="text-[11px] text-[var(--color-error)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={`${mode}-description`}
              className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest"
            >
              Description
            </label>
            <CharCounter value={form.description} max={500} />
          </div>
          <textarea
            id={`${mode}-description`}
            name="description"
            maxLength={500}
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Optional — summary of what this category covers"
            className={`w-full px-3 py-2.5 rounded-lg bg-white border text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all resize-y min-h-[96px] ${
              errors.description
                ? "border-[var(--color-error)]/40"
                : "border-[var(--color-border)]"
            }`}
          />
          {errors.description && (
            <p className="text-[11px] text-[var(--color-error)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!isDirty || pending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : mode === "create" ? (
            <PlusCircle className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {mode === "create" ? "Add category" : "Update Category"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}

        {mode === "edit" && !isDirty && (
          <p className="text-[10px] text-[var(--color-text-muted)] italic">
            No changes
          </p>
        )}
      </div>
    </form>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[10px] font-semibold tabular-nums text-[var(--color-text-muted)]">
      {value.length} / {max}
    </span>
  );
}
