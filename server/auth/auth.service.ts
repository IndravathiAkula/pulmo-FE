import "server-only";

/**
 * Auth service — the business-logic boundary.
 *
 * Rules:
 *  1. Calls apiClient (never raw fetch) — except login's
 *     post-login profile fetch which uses rawFetch directly
 *     to avoid cookie read/write timing issues.
 *  2. Uses typed DTOs from apiTypes.
 *  3. Returns ApiResult<T> — never throws for expected errors.
 *  4. Cookie writes happen HERE for login/refresh because
 *     only the service knows when tokens arrive.
 *  5. Server Actions and RSCs consume this, nothing else.
 */

import { apiClient } from "../api/apiClient";
import { rawFetch } from "../api/apiClient";
import { AUTH_ROUTES, USER_ROUTES } from "../api/apiRoutes";
import type {
  ApiResult,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
  RefreshResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
  UserResponse,
} from "../api/apiTypes";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
  getDeviceFingerprint,
  setUserInfoCookie,
} from "./auth.cookies";

export const authService = {
  // ─── Register ────────────────────────────────────────────
  async register(data: RegisterRequest): Promise<ApiResult<RegisterResponse>> {
    return apiClient<RegisterResponse>(AUTH_ROUTES.register, {
      method: "POST",
      body: data,
      skipAuth: true,
    });
  },

  // ─── Email verification ──────────────────────────────────
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResult<null>> {
    return apiClient<null>(AUTH_ROUTES.verifyEmail, {
      method: "POST",
      body: data,
      skipAuth: true,
    });
  },

  async resendVerification(data: ResendVerificationRequest): Promise<ApiResult<null>> {
    return apiClient<null>(AUTH_ROUTES.resendVerification, {
      method: "POST",
      body: data,
      skipAuth: true,
    });
  },

  // ─── Login ───────────────────────────────────────────────
  async login(data: Omit<LoginRequest, "deviceFingerprint">): Promise<ApiResult<LoginResponse>> {
    const deviceFingerprint = await getDeviceFingerprint();

    const result = await apiClient<LoginResponse>(AUTH_ROUTES.login, {
      method: "POST",
      body: { ...data, deviceFingerprint },
      skipAuth: true,
    });

    if (!result.ok) return result;

    // 1. Persist tokens
    await setAuthCookies({
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    });

    // 2. Fetch profile immediately using the fresh token directly.
    //    We use rawFetch (not apiClient) because:
    //    - The token was just set in the RESPONSE cookies, not yet
    //      in the REQUEST cookies, so the interceptor can't read it.
    //    - We already have the token in memory — pass it directly.
    try {
      const profileResult = await rawFetch<UserProfile>(
        USER_ROUTES.profile,
        { method: "GET", skipAuth: true, skipRetry: true },
        { Authorization: `Bearer ${result.data.accessToken}` }
      );

      if (profileResult.ok) {
        await setUserInfoCookie(profileResult.data);
      }
    } catch {
      // Profile fetch failed — fall back to email from login request.
      await setUserInfoCookie({
        id: "",
        firstName: data.email.split("@")[0],
        lastName: "",
        email: data.email,
        phone: null,
        interests: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return result;
  },

  // ─── Token refresh ──────────────────────────────────────
  async refreshSession(): Promise<ApiResult<RefreshResponse>> {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return {
        ok: false,
        error: { status: 401, code: "NO_REFRESH_TOKEN", message: "No refresh token" },
      };
    }

    const deviceFingerprint = await getDeviceFingerprint();

    const result = await apiClient<RefreshResponse>(AUTH_ROUTES.refresh, {
      method: "POST",
      body: { refreshToken, deviceFingerprint },
      skipAuth: true,
      skipRetry: true,
    });

    if (result.ok) {
      await setAuthCookies({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      });
    }

    return result;
  },

  // ─── Forgot / Reset Password ─────────────────────────────
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResult<null>> {
    return apiClient<null>(AUTH_ROUTES.forgotPassword, {
      method: "POST",
      body: data,
      skipAuth: true,
    });
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResult<null>> {
    return apiClient<null>(AUTH_ROUTES.resetPassword, {
      method: "POST",
      body: data,
      skipAuth: true,
    });
  },

  // ─── Change Password (requires auth) ─────────────────────
  async changePassword(data: ChangePasswordRequest): Promise<ApiResult<null>> {
    const result = await apiClient<null>(AUTH_ROUTES.changePassword, {
      method: "POST",
      body: data,
    });

    // Backend revokes all sessions on password change — clear local cookies
    if (result.ok) {
      await clearAuthCookies();
    }

    return result;
  },

  // ─── Logout ──────────────────────────────────────────────
  async logout(): Promise<ApiResult<null>> {
    try {
      const refreshToken = await getRefreshToken();
      const deviceFingerprint = await getDeviceFingerprint();

      if (refreshToken) {
        await apiClient<null>(AUTH_ROUTES.logout, {
          method: "POST",
          body: { refreshToken, deviceFingerprint },
        });
      }
    } catch {
      // Even if backend call fails, clear local cookies
    }

    await clearAuthCookies();
    return { ok: true, data: null, message: "Logged out" };
  },

  async logoutAll(): Promise<ApiResult<null>> {
    try {
      await apiClient<null>(AUTH_ROUTES.logoutAll, { method: "POST" });
    } catch {
      // Best-effort
    }

    await clearAuthCookies();
    return { ok: true, data: null, message: "All sessions revoked" };
  },

  // ─── Current user summary (/auth/me) ─────────────────────
  /**
   * Lightweight user summary — id, email, userType, status, roles.
   * Use this when you need fresh role/group data (e.g. role-gating
   * the dashboard layout) without paying for the full profile.
   */
  async me(): Promise<ApiResult<UserResponse>> {
    return apiClient<UserResponse>(AUTH_ROUTES.me, { method: "GET" });
  },

  // ─── Profile ─────────────────────────────────────────────
  async getProfile(): Promise<ApiResult<UserProfile>> {
    return apiClient<UserProfile>(USER_ROUTES.profile, { method: "GET" });
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResult<UserProfile>> {
    const result = await apiClient<UserProfile>(USER_ROUTES.updateProfile, {
      method: "PUT",
      body: data,
    });

    // Update cached user info on success
    if (result.ok) {
      await setUserInfoCookie(result.data);
    }

    return result;
  },
};
