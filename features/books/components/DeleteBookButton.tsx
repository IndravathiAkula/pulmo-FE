"use client";

/**
 * DeleteBookButton — confirm + soft-delete a book.
 *
 * Opens a themed ConfirmDialog on click; the server action handles the
 * soft-delete + redirect, so this component is purely the trigger.
 */

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/client/ui/feedback/ToastProvider";
import { ConfirmDialog } from "@/client/ui/ConfirmDialog";
import { deleteBookAction } from "@/features/books/actions/book.action";

export function DeleteBookButton({
  bookId,
  bookTitle,
  variant = "default",
}: {
  bookId: string;
  bookTitle: string;
  variant?: "default" | "compact";
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        // Server action redirects on success so we don't return here.
        await deleteBookAction(bookId);
      } catch {
        // Redirect errors are normal — Next throws them to navigate.
        // Anything else surfaces as a toast.
        toast.error("Could not delete the book — please try again");
      }
      setConfirmOpen(false);
    });
  };

  const dialog = (
    <ConfirmDialog
      open={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      onConfirm={handleConfirm}
      tone="danger"
      title={`Delete "${bookTitle}"?`}
      description="This cannot be undone. Readers will lose access to the book."
      confirmLabel="Delete book"
      pendingLabel="Deleting…"
      pending={pending}
    />
  );

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
          aria-label={`Delete ${bookTitle}`}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[var(--color-error)] bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Delete
      </button>
      {dialog}
    </>
  );
}
