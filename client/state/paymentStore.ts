"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaymentState {
  purchasedBooks: Set<string>;
  purchaseBook: (bookId: string) => Promise<void>;
  hasPurchased: (bookId: string) => boolean;
  clearPurchases: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      purchasedBooks: new Set<string>(),

      purchaseBook: async (bookId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        set((state) => ({
          purchasedBooks: new Set([...state.purchasedBooks, bookId]),
        }));
      },

      hasPurchased: (bookId: string) => {
        return get().purchasedBooks.has(bookId);
      },

      clearPurchases: () => {
        set({ purchasedBooks: new Set<string>() });
      },
    }),
    {
      name: 'payment-storage',
      partialize: (state) => ({
        purchasedBooks: Array.from(state.purchasedBooks),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { purchasedBooks?: string[] };
        return {
          ...currentState,
          purchasedBooks: new Set(persisted.purchasedBooks || []),
        };
      },
    }
  )
);
