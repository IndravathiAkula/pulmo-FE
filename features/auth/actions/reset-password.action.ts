"use server";

import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface ResetPasswordActionState {
  success: boolean;
  message: string;
  errors?: {
    newPassword?: string;
    confirmPassword?: string;
  };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const token = formData.get("token")?.toString() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  // ── Validation ───────────────────────────────────────────
  if (!token) {
    return { success: false, message: "Reset token is missing or invalid" };
  }

  const errors: ResetPasswordActionState["errors"] = {};

  if (!newPassword) errors.newPassword = "New password is required";
  else if (newPassword.length < 8)
    errors.newPassword = "Password must be at least 8 characters";

  if (newPassword !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  try {
    const result = await authService.resetPassword({ token, newPassword });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }

  // Redirect to login with success message
  redirect("/login?message=Password+reset+successful.+Please+log+in+with+your+new+password.");
}
