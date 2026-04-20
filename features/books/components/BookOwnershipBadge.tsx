"use client";

// BookOwnershipBadge – Client Island for the ownership badge on BookCard.
// Reads Zustand stores; receives only bookId (serializable) from the Server Component.

import { Lock } from 'lucide-react';
import { useAuthStore } from '@/client/state/authStore';
import { usePaymentStore } from '@/client/state/paymentStore';

interface BookOwnershipBadgeProps {
  bookId: string;
}

export function BookOwnershipBadge({ bookId }: BookOwnershipBadgeProps) {
  const { isAuthenticated } = useAuthStore();
  const { hasPurchased } = usePaymentStore();
  const purchased = isAuthenticated && hasPurchased(bookId);

  if (purchased) {
    return (
  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-green-50 border border-green-200 text-[var(--color-success)]">
    ✓ Owned
  </span>
);
  }

  return (
  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-white/90 border border-[var(--color-border)] text-[var(--color-text-body)]">
    <Lock className="w-3 h-3" /> Locked
  </span>
);
}
