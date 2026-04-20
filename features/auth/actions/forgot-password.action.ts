"use server";

import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface ForgotPasswordActionState {
  success: boolean;
  message: string;
  errors?: {
    email?: string;
  };
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const email = formData.get("email")?.toString().trim() ?? "";

  // ── Validation ───────────────────────────────────────────
  if (!email) {
    return { success: false, message: "Validation failed", errors: { email: "Email is required" } };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Validation failed", errors: { email: "Invalid email format" } };
  }

  try {
    const result = await authService.forgotPassword({ email });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    // Backend always returns success to prevent user enumeration
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
