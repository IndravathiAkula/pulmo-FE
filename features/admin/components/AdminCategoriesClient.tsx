"use client";

/**
 * AdminCategoriesClient — owns the modal state for the categories
 * list page. Page-level Server Component fetches categories and hands
 * them in; this component renders the list, the "New Category"
 * trigger, and the create/edit modal.
 */

import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import type { CategoryResponse } from "@/server/api/apiTypes";
import { Modal } from "@/client/ui/Modal";
import { EmptyState } from "@/client/ui/feedback/EmptyState";
import { CategoryRow } from "./CategoryRow";
import { CategoryForm } from "./CategoryForm";

type ModalState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; category: CategoryResponse };

export function AdminCategoriesClient({
  categories,
}: {
  categories: CategoryResponse[];
}) {
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const close = () => setModal({ kind: "closed" });

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModal({ kind: "create" })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Categories help authors classify their books. Add the first one to get started."
          action={{
            label: "Create category",
            onClick: () => setModal({ kind: "create" }),
            icon: Plus,
          }}
        />
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onEdit={(c) => setModal({ kind: "edit", category: c })}
            />
          ))}
        </ul>
      )}

      <Modal
        open={modal.kind !== "closed"}
        onClose={close}
        size="md"
        title={modal.kind === "edit" ? "Edit Category" : "New Category"}
        subtitle={
          modal.kind === "edit"
            ? `/${modal.category.slug}`
            : "Slug will be auto-generated from the name"
        }
      >
        {modal.kind === "create" && (
          <CategoryForm mode="create" onSuccess={close} onCancel={close} />
        )}
        {modal.kind === "edit" && (
          <CategoryForm
            mode="edit"
            category={modal.category}
            onSuccess={close}
            onCancel={close}
          />
        )}
      </Modal>
    </>
  );
}

