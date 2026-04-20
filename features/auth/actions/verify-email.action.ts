"use server";

import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface VerifyEmailActionState {
  success: boolean;
  message: string;
}

export async function verifyEmailAction(
  token: string
): Promise<VerifyEmailActionState> {
  if (!token) {
    return { success: false, message: "Verification token is missing" };
  }

  try {
    const result = await authService.verifyEmail({ token });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    return { success: true, message: result.message };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

export interface ResendVerificationActionState {
  success: boolean;
  message: string;
}

export async function resendVerificationAction(
  _prevState: ResendVerificationActionState,
  formData: FormData
): Promise<ResendVerificationActionState> {
  const email = formData.get("email")?.toString().trim() ?? "";

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  try {
    const result = await authService.resendVerification({ email });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    return { success: true, message: result.message };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
