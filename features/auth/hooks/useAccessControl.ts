// Access Control Service
// Centralizes all access rules in one place.
// This is the ONLY place that decides canPreview() and canReadFull().
// Pages/components call this service – they do NOT read stores directly
// to make access decisions.
//
// In production: canReadFull would also verify a server-side token.

import { useAuthStore } from '@/client/state/authStore';
import { usePaymentStore } from '@/client/state/paymentStore';

export function useAccessControl() {
  const { isAuthenticated } = useAuthStore();
  const { hasPurchased } = usePaymentStore();

  /**
   * Everyone can see the preview (page 1).
   * Future: could restrict to registered users only.
   */
  const canPreview = (_bookId: string): boolean => {
    return true;
  };

  /**
   * Full read access requires:
   *   1. User is authenticated
   *   2. User has purchased the specific book
   */
  const canReadFull = (bookId: string): boolean => {
    return isAuthenticated && hasPurchased(bookId);
  };

  return {
    canPreview,
    canReadFull,
  };
}
