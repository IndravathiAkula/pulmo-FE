"use client";

/**
 * OwnedBooksProvider — client-side cache of the user's purchased book IDs.
 *
 * Mirrors the CartProvider pattern: fetches from `/api/owned-books` on
 * mount (and whenever auth flips), exposes an `owns(bookId)` predicate
 * via context, and `refresh()` for callers that just mutated ownership
 * (e.g. the checkout flow).
 *
 * Every <BookCard> in the tree calls `useOwnedBooks()` to decide whether
 * to show "Read" vs "Add to Cart". The first render is always "not owned"
 * (safe default); once the fetch settles (typically <200 ms), owned cards
 * flip to the "Owned" CTA without a full page reload.
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

interface OwnedBooksContextValue {
  /** O(1) membership test — is this book ID in the user's library? */
  owns: (bookId: string) => boolean;
  /** True while the initial ownership fetch is still in flight. */
  loading: boolean;
  /** Re-fetch the owned set. Call after checkout / purchase. */
  refresh: () => Promise<void>;
}

const OwnedBooksContext = createContext<OwnedBooksContextValue>({
  owns: () => false,
  loading: false,
  refresh: async () => {},
});

export function useOwnedBooks(): OwnedBooksContextValue {
  return useContext(OwnedBooksContext);
}

export function OwnedBooksProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(isAuthenticated); // starts loading if auth'd
  const inFlightRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOwnedIds(new Set());
      setLoading(false);
      return;
    }

    // Coalesce concurrent refreshes (same pattern as CartProvider).
    if (inFlightRef.current) return inFlightRef.current;

    setLoading(true);
    const promise = (async () => {
      try {
        const res = await fetch("/api/owned-books", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { bookIds: string[] };
        setOwnedIds(new Set(json.bookIds ?? []));
      } catch {
        // Swallow — cards stay at "not owned" which is the safe default.
      } finally {
        inFlightRef.current = null;
        setLoading(false);
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }, [isAuthenticated]);

  // Initial sync + re-sync whenever auth flips.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const owns = useCallback(
    (bookId: string) => ownedIds.has(bookId),
    [ownedIds]
  );

  return (
    <OwnedBooksContext.Provider value={{ owns, loading, refresh }}>
      {children}
    </OwnedBooksContext.Provider>
  );
}
