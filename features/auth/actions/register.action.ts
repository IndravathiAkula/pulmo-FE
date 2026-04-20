"use server";

/**
 * Register server action.
 *
 * On success: redirects to verify-email instruction page.
 * On conflict (409): tells user the email already exists.
 */

import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth.service";
import { ApiError, ConflictError } from "@/server/api/errors";

export interface RegisterActionState {
  success: boolean;
  message: string;
  errors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  // ── Input validation ─────────────────────────────────────
  const errors: RegisterActionState["errors"] = {};

  if (!firstName) errors.firstName = "First name is required";
  if (!lastName) errors.lastName = "Last name is required";

  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Invalid email format";

  if (!password) errors.password = "Password is required";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters";

  if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  // ── Call auth service ────────────────────────────────────
  try {
    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      userType: "READER",
    });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
  } catch (error) {
    if (error instanceof ConflictError) {
      return { success: false, message: "An account with this email already exists" };
    }
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }

  // ── Redirect to verification page ────────────────────────
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
