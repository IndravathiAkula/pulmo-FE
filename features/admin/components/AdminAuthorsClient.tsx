"use client";

/**
 * AdminAuthorsClient — owns the modal state for the authors list page.
 *
 * The page-level Server Component fetches the authors and passes them
 * here; this client component renders the list, the "Invite Author"
 * trigger, and the create/edit modal.
 *
 * Why a single modal with mode switching instead of two? Because only
 * one dialog is ever open at a time, sharing a single <Modal> mount
 * keeps animation state and focus management simple.
 */

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type { AuthorResponse } from "@/server/api/apiTypes";
import { Modal } from "@/client/ui/Modal";
import { EmptyState } from "@/client/ui/feedback/EmptyState";
import { AuthorRow } from "./AuthorRow";
import { AuthorForm } from "./AuthorForm";

type ModalState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; author: AuthorResponse };

export function AdminAuthorsClient({
  authors,
}: {
  authors: AuthorResponse[];
}) {
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const close = () => setModal({ kind: "closed" });

  return (
    <>
      {/* Header — title is rendered by the Server Component above; we
          only own the trigger button so we can attach client state. */}
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModal({ kind: "create" })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Invite Author
        </button>
      </div>

      {authors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No authors yet"
          description="Invite your first author — they'll receive a verification email and can start submitting books once confirmed."
          action={{
            label: "Invite an author",
            onClick: () => setModal({ kind: "create" }),
            icon: UserPlus,
          }}
        />
      ) : (
        <ul className="space-y-3">
          {authors.map((author) => (
            <AuthorRow
              key={author.id}
              author={author}
              onEdit={(a) => setModal({ kind: "edit", author: a })}
            />
          ))}
        </ul>
      )}

      <Modal
        open={modal.kind !== "closed"}
        onClose={close}
        size="md"
        title={modal.kind === "edit" ? "Edit Author" : "Invite Author"}
        subtitle={
          modal.kind === "edit"
            ? modal.author.email + " · email cannot be changed"
            : "A verification email will be sent automatically"
        }
      >
        {modal.kind === "create" && (
          <AuthorForm mode="create" onSuccess={close} onCancel={close} />
        )}
        {modal.kind === "edit" && (
          <AuthorForm
            mode="edit"
            author={modal.author}
            onSuccess={close}
            onCancel={close}
          />
        )}
      </Modal>
    </>
  );
}

