"use server";

import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface ChangePasswordActionState {
  success: boolean;
  message: string;
  errors?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

export async function changePasswordAction(
  _prevState: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const currentPassword = formData.get("currentPassword")?.toString() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  // ── Validation ───────────────────────────────────────────
  const errors: ChangePasswordActionState["errors"] = {};

  if (!currentPassword) errors.currentPassword = "Current password is required";
  if (!newPassword) errors.newPassword = "New password is required";
  else if (newPassword.length < 8)
    errors.newPassword = "Password must be at least 8 characters";

  if (newPassword !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  if (newPassword === currentPassword)
    errors.newPassword = "New password must be different from current password";

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  try {
    const result = await authService.changePassword({ currentPassword, newPassword });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    // Backend revokes all sessions — cookies already cleared by service
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }

  // All sessions revoked — redirect to login
  redirect("/login?message=Password+changed+successfully.+Please+log+in+with+your+new+password.");
}
