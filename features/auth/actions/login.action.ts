"use server";

/**
 * Login server action.
 *
 * Browser → Server Action → authService.login() → backend
 *
 * The browser never sees the backend URL, token values,
 * or raw error payloads. It receives only the ActionState.
 */

import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface LoginActionState {
  success: boolean;
  message: string;
  errors?: {
    email?: string;
    password?: string;
  };
}

/**
 * Accept only same-origin relative paths for post-login redirect.
 * Rejects:
 *   - protocol-relative URLs ("//evil.com/x" — browsers resolve to https://evil.com)
 *   - absolute URLs ("http://evil.com", "https://evil.com")
 *   - backslash tricks ("/\evil.com") that some clients normalise to "//"
 *   - anything not starting with a single "/"
 * Fragment and query strings on a `/`-prefixed path are fine.
 */
function sanitizeReturnTo(raw: string | undefined): string {
  const fallback = "/";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  // Guard against protocol-relative and "/\…" variants.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString());

  // ── Input validation ─────────────────────────────────────
  const errors: LoginActionState["errors"] = {};

  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Invalid email format";

  if (!password) errors.password = "Password is required";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters";

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  // ── Call auth service ────────────────────────────────────
  try {
    const result = await authService.login({ email, password });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    // Cookies already set by authService.login()
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }

  // ── Redirect on success (must be outside try/catch) ──────
  redirect(returnTo);
}
