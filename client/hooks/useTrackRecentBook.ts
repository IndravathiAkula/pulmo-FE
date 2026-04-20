"use client";

import { useEffect } from 'react';
import { useRecentBooksStore } from '@/client/state/useRecentBooksStore';

interface TrackOptions {
  id: string;
  title: string;
  cover: string;
  doctor: string;
}

/**
 * Hook to track a book as recently viewed.
 * Runs once when `isLoaded` becomes true (i.e., PDF has loaded successfully).
 * Call this inside any reader component.
 */
export const useTrackRecentBook = ({ id, title, cover, doctor }: TrackOptions, isLoaded: boolean) => {
  const addRecentBook = useRecentBooksStore((s) => s.addRecentBook);

  useEffect(() => {
    if (!isLoaded) return;
    addRecentBook({ id, title, cover, doctor });
  // Run only once when the book finishes loading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);
};
