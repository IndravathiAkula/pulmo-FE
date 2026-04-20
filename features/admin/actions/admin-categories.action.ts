"use server";

/**
 * Admin category CRUD actions — wraps `categoriesService` admin methods.
 *
 * Categories are simple (name + optional description), so the
 * /dashboard/admin/categories page renders create + edit + toggle in
 * one screen. Each action revalidates the admin list AND the public
 * `/categories` consumers (book filters, etc.).
 */

import { revalidatePath } from "next/cache";
import { categoriesService } from "@/server/catalog/categories.service";
import { ApiError } from "@/server/api/errors";

type CategoryFieldErrors = {
  name?: string;
  description?: string;
};

export interface AdminCategoryActionState {
  success: boolean;
  message: string;
  errors?: CategoryFieldErrors;
}

function revalidateAfter() {
  revalidatePath("/dashboard/admin/categories");
  // Public surfaces will re-fetch when their cache profile expires;
  // we don't have public category caching here yet, but bookkeeping
  // these revalidations now keeps Phase 5 cheap.
  revalidatePath("/");
}

function validate(opts: {
  name: string;
  description?: string;
}): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};
  if (!opts.name) errors.name = "Name is required";
  else if (opts.name.length > 100)
    errors.name = "Name must be under 100 characters";
  if (opts.description && opts.description.length > 500) {
    errors.description = "Description must be under 500 characters";
  }
  return errors;
}

// ─── Create ─────────────────────────────────────────────────
export async function createCategoryAction(
  _prev: AdminCategoryActionState,
  formData: FormData
): Promise<AdminCategoryActionState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const errors = validate({ name, description });

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  try {
    const result = await categoriesService.create({
      name,
      description: description || undefined,
    });
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    revalidateAfter();
    return { success: true, message: result.message ?? "Category created" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not create category — please try again",
    };
  }
}

// ─── Update ─────────────────────────────────────────────────
export async function updateCategoryAction(
  categoryId: string,
  _prev: AdminCategoryActionState,
  formData: FormData
): Promise<AdminCategoryActionState> {
  if (!categoryId) return { success: false, message: "Missing category id" };

  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const errors = validate({ name, description });

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  try {
    const result = await categoriesService.update(categoryId, {
      name,
      description: description || undefined,
    });
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    revalidateAfter();
    return { success: true, message: result.message ?? "Category updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not update category — please try again",
    };
  }
}

// ─── Delete ─────────────────────────────────────────────────
export interface AdminCategoryToggleResult {
  success: boolean;
  message: string;
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<AdminCategoryToggleResult> {
  if (!categoryId) return { success: false, message: "Missing category id" };

  try {
    const result = await categoriesService.remove(categoryId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    revalidateAfter();
    return { success: true, message: "Category deleted" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not delete category — please try again",
    };
  }
}

// ─── Toggle active flag ────────────────────────────────────
export async function toggleCategoryAction(
  categoryId: string
): Promise<AdminCategoryToggleResult> {
  if (!categoryId) return { success: false, message: "Missing category id" };

  try {
    const result = await categoriesService.toggle(categoryId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    revalidateAfter();
    return {
      success: true,
      message:
        result.message ??
        (result.data.active
          ? "Category activated"
          : "Category deactivated"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not toggle category — please try again",
    };
  }
}
