import "server-only";

/**
 * Session helpers for Server Components and Server Actions.
 *
 * IMPORTANT: getSession() reads ONLY from cookies.
 * It never makes API calls — this is critical because it runs
 * in the root layout (Server Component) where:
 *  - API calls can trigger the interceptor's refresh-retry
 *  - Refresh-retry tries to write cookies
 *  - Cookie writes are FORBIDDEN in Server Components
 *
 * User info is cached in a cookie during login by auth.service.
 */

import type { JwtClaims } from "../api/apiTypes";
import { getAccessToken, getUserInfo } from "./auth.cookies";

export interface Session {
  isAuthenticated: boolean;
  user: SessionUser | null;
}

/** Lightweight user info derived from JWT claims + cached profile */
export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "READER" | "AUTHOR";
  roles: string[];
}

/**
 * Decode JWT claims without verification.
 * Verification is the backend's job — we only decode to read claims.
 */
function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Get the current session — cookie reads only, no API calls.
 *
 * Combines:
 *  - JWT claims from the access token cookie (id, userType, roles)
 *  - Cached profile from the user info cookie (firstName, lastName, email)
 *
 * Safe to call from Server Components (no side-effects).
 */
export async function getSession(): Promise<Session> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return { isAuthenticated: false, user: null };

    const claims = decodeJwtClaims(accessToken);
    if (!claims) return { isAuthenticated: false, user: null };

    // Check if token is expired
    if (claims.exp * 1000 < Date.now()) {
      return { isAuthenticated: false, user: null };
    }

    // Read cached profile from cookie (set during login)
    const userInfo = await getUserInfo();
    if (!userInfo) {
      // Token valid but no profile cached — still authenticated
      // but with minimal info from JWT only
      return {
        isAuthenticated: true,
        user: {
          id: claims.sub,
          firstName: "",
          lastName: "",
          email: claims.upn ?? "",
          userType: claims.userType,
          roles: claims.groups ?? [],
        },
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        userType: claims.userType,
        roles: claims.groups ?? [],
      },
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Lightweight session check — JWT decode only, no cookie reads beyond token.
 * Use when you only need id/type/roles (e.g., access guards).
 */
export async function getSessionLight(): Promise<{
  isAuthenticated: boolean;
  claims: JwtClaims | null;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) return { isAuthenticated: false, claims: null };

  const claims = decodeJwtClaims(accessToken);
  if (!claims || claims.exp * 1000 < Date.now()) {
    return { isAuthenticated: false, claims: null };
  }

  return { isAuthenticated: true, claims };
}

/**
 * Guard that throws if not authenticated.
 * Use in Server Actions that require auth.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();

  if (!session.isAuthenticated || !session.user) {
    throw new Error("Authentication required");
  }

  return session.user;
}
