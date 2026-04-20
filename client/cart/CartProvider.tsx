"use client";

/**
 * CartProvider — client-side cart cache for the navbar badge + cart-
 * membership checks (e.g. "is this book already in the cart?").
 *
 * Source of truth is always the server `/cart` endpoint. The provider
 * keeps a lightweight snapshot (`count`, `total`, `bookIds`) so client
 * components can render instantly, and exposes `refresh()` for callers
 * to sync after a mutation.
 *
 * `bump()` lets the optimistic UI nudge the badge before the server
 * round-trip completes — the next `refresh()` reconciles the truth.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/client/auth/SessionProvider";

interface CartSnapshot {
  count: number;
  total: number;
  bookIds: Set<string>;
}

interface CartContextValue {
  count: number;
  total: number;
  /** O(1) check — is this book already in the cart? */
  hasItem: (bookId: string) => boolean;
  refresh: () => Promise<void>;
  bump: (delta: number) => void;
  /** Call after a successful addToCart to update the local set immediately
   *  without waiting for the full refresh round-trip. */
  addItemLocally: (bookId: string) => void;
}

const CartContext = createContext<CartContextValue>({
  count: 0,
  total: 0,
  hasItem: () => false,
  refresh: async () => {},
  bump: () => {},
  addItemLocally: () => {},
});

export function useCart(): CartContextValue {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [snapshot, setSnapshot] = useState<CartSnapshot>({
    count: 0,
    total: 0,
    bookIds: new Set(),
  });
  const inFlightRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSnapshot({ count: 0, total: 0, bookIds: new Set() });
      return;
    }

    // Coalesce concurrent refreshes — multiple callers in the same
    // tick share one fetch.
    if (inFlightRef.current) return inFlightRef.current;

    const promise = (async () => {
      try {
        const res = await fetch("/api/cart/count", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          count: number;
          total: number;
          bookIds?: string[];
        };
        setSnapshot({
          count: json.count ?? 0,
          total: json.total ?? 0,
          bookIds: new Set(json.bookIds ?? []),
        });
      } catch {
        // Swallow — badge stays at last-known value.
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }, [isAuthenticated]);

  const bump = useCallback((delta: number) => {
    setSnapshot((prev) => ({
      ...prev,
      count: Math.max(0, prev.count + delta),
    }));
  }, []);

  const hasItem = useCallback(
    (bookId: string) => snapshot.bookIds.has(bookId),
    [snapshot.bookIds]
  );

  const addItemLocally = useCallback((bookId: string) => {
    setSnapshot((prev) => ({
      ...prev,
      bookIds: new Set([...prev.bookIds, bookId]),
    }));
  }, []);

  // Initial sync + re-sync whenever auth flips.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <CartContext.Provider
      value={{
        count: snapshot.count,
        total: snapshot.total,
        hasItem,
        refresh,
        bump,
        addItemLocally,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
