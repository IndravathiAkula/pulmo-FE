"use server";

/**
 * Admin author CRUD actions — wraps the `/admin/authors*` endpoints.
 *
 * Author accounts are invite-style: `create` provisions the user and
 * sends a verification email. `resend` lets admins re-send that invite
 * (or a re-verification) without rebuilding the account.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorsService } from "@/server/catalog/authors.service";
import { ApiError } from "@/server/api/errors";

type AuthorFieldErrors = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  designation?: string;
  description?: string;
};

export interface AdminAuthorActionState {
  success: boolean;
  message: string;
  errors?: AuthorFieldErrors;
  /** Returned by createAuthorAction so the client can route or reset. */
  authorId?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;

function validateCommon(opts: {
  firstName: string;
  lastName: string;
  phone?: string;
  description?: string;
}): AuthorFieldErrors {
  const errors: AuthorFieldErrors = {};

  if (!opts.firstName) errors.firstName = "First name is required";
  if (!opts.lastName) errors.lastName = "Last name is required";

  if (opts.phone && !PHONE_PATTERN.test(opts.phone)) {
    errors.phone = "Invalid phone number format";
  }

  if (opts.description && opts.description.length > 2000) {
    errors.description = "Description must be under 2000 characters";
  }

  return errors;
}

// ─── Create ─────────────────────────────────────────────────
export async function createAuthorAction(
  _prev: AdminAuthorActionState,
  formData: FormData
): Promise<AdminAuthorActionState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const designation = formData.get("designation")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const qualification = formData.get("qualification")?.toString().trim() ?? "";
  const profileUrl = formData.get("profileUrl")?.toString().trim() ?? "";

  const errors = validateCommon({ firstName, lastName, phone, description });

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email must be valid";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  try {
    const result = await authorsService.adminCreate({
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      designation: designation || undefined,
      description: description || undefined,
      qualification: qualification || undefined,
      profileUrl: profileUrl || undefined,
    });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/dashboard/admin/authors");
    return {
      success: true,
      message:
        result.message ?? "Author invited — verification email sent",
      authorId: result.data.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not create author — please try again",
    };
  }
}

// ─── Update ─────────────────────────────────────────────────
export async function updateAuthorAction(
  authorId: string,
  _prev: AdminAuthorActionState,
  formData: FormData
): Promise<AdminAuthorActionState> {
  if (!authorId) return { success: false, message: "Missing author id" };

  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const designation = formData.get("designation")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const qualification = formData.get("qualification")?.toString().trim() ?? "";
  const profileUrl = formData.get("profileUrl")?.toString().trim() ?? "";

  const errors = validateCommon({ firstName, lastName, phone, description });

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  try {
    const result = await authorsService.adminUpdate(authorId, {
      firstName,
      lastName,
      phone: phone || undefined,
      designation: designation || undefined,
      description: description || undefined,
      qualification: qualification || undefined,
      profileUrl: profileUrl || undefined,
    });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/dashboard/admin/authors");
    revalidatePath(`/dashboard/admin/authors/${authorId}/edit`);
    return {
      success: true,
      message: result.message ?? "Author updated",
      authorId,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not update author — please try again",
    };
  }
}

// ─── Delete (soft-deactivate) ──────────────────────────────
export async function deleteAuthorAction(authorId: string): Promise<void> {
  if (!authorId) return;

  try {
    await authorsService.adminDelete(authorId);
  } catch {
    // Same pattern as deleteBookAction — let the next render reflect truth.
  }

  revalidatePath("/dashboard/admin/authors");
  redirect("/dashboard/admin/authors");
}

// ─── Toggle active flag ────────────────────────────────────
export interface AdminToggleResult {
  success: boolean;
  message: string;
}

export async function toggleAuthorAction(
  authorId: string
): Promise<AdminToggleResult> {
  if (!authorId) return { success: false, message: "Missing author id" };

  try {
    const result = await authorsService.adminToggle(authorId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    revalidatePath("/dashboard/admin/authors");
    return {
      success: true,
      message:
        result.message ??
        (result.data.active ? "Author activated" : "Author deactivated"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not toggle author — please try again",
    };
  }
}

// ─── Resend verification email ─────────────────────────────
export async function resendAuthorVerificationAction(
  authorId: string
): Promise<AdminToggleResult> {
  if (!authorId) return { success: false, message: "Missing author id" };

  try {
    const result = await authorsService.adminResendVerification(authorId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
    return {
      success: true,
      message: result.message ?? "Verification email re-sent",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not resend verification — please try again",
    };
  }
}
