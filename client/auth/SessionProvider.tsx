"use client";

/**
 * SessionProvider — bridges server-driven auth to client components.
 *
 * Architecture:
 *  1. Root layout (Server Component) calls `getSession()`
 *  2. Passes session data to this provider as serializable props
 *  3. This provider exposes session via React context
 *  4. ALSO syncs to the existing Zustand authStore so existing
 *     components (BookCTA, PurchaseSection, etc.) keep working
 *
 * This is the safe migration path: server is the source of truth,
 * Zustand acts as a derived cache for backward compatibility.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/client/state/authStore";

export interface SessionData {
  isAuthenticated: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: "READER" | "AUTHOR";
    roles: string[];
  } | null;
}

const SessionContext = createContext<SessionData>({
  isAuthenticated: false,
  user: null,
});

export function SessionProvider({
  session,
  children,
}: {
  session: SessionData;
  children: ReactNode;
}) {
  // Sync server session → Zustand authStore for backward compat
  useEffect(() => {
    const store = useAuthStore.getState();

    if (session.isAuthenticated && session.user) {
      // Only update if state differs to avoid unnecessary re-renders
      if (
        !store.isAuthenticated ||
        store.user?.email !== session.user.email
      ) {
        useAuthStore.setState({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: `${session.user.firstName} ${session.user.lastName}`,
          },
        });
      }
    } else {
      if (store.isAuthenticated) {
        useAuthStore.setState({
          isAuthenticated: false,
          user: null,
        });
      }
    }
  }, [session]);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionData {
  return useContext(SessionContext);
}
