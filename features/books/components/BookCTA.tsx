"use client";

// BookCTA – Client Island for the action button at the bottom of BookCard.
// Reads Zustand stores; receives only bookId (serializable) from the Server Component.

import { useAuthStore } from '@/client/state/authStore';
import { usePaymentStore } from '@/client/state/paymentStore';

interface BookCTAProps {
  bookId: string;
}

export function BookCTA({ bookId }: BookCTAProps) {
  const { isAuthenticated } = useAuthStore();
  const { hasPurchased } = usePaymentStore();
  const purchased = isAuthenticated && hasPurchased(bookId);

  return (
    <div
      className={`w-full text-center text-sm font-semibold py-2 rounded-xl transition-all duration-200
    ${purchased
          ? 'bg-green-50 text-[var(--color-success)] border border-green-200 group-hover:bg-green-100'
          : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-blue-700 transition-all duration-200'
        }`}
    >
      {purchased ? 'Read Now →' : 'Preview Book'}
    </div>
  );
}
