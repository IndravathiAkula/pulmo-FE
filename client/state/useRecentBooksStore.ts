"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentBook {
  id: string;
  title: string;
  cover: string;
  doctor: string;
  viewedAt: number;
}

interface RecentBooksState {
  recentBooks: RecentBook[];
  addRecentBook: (book: Omit<RecentBook, 'viewedAt'>) => void;
  clearRecentBooks: () => void;
}

export const useRecentBooksStore = create<RecentBooksState>()(
  persist(
    (set) => ({
      recentBooks: [],

      addRecentBook: (book) =>
        set((state) => {
          // Remove existing entry (if reopened) to move it to top
          const filtered = state.recentBooks.filter((b) => b.id !== book.id);
          const updated: RecentBook[] = [
            { ...book, viewedAt: Date.now() },
            ...filtered,
          ];
          // Limit to 15 most recent
          return { recentBooks: updated.slice(0, 15) };
        }),

      clearRecentBooks: () => set({ recentBooks: [] }),
    }),
    {
      name: 'recent-books-storage',
    }
  )
);
