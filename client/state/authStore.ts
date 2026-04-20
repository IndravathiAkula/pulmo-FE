"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePaymentStore } from './paymentStore';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        const mockUser: User = {
          id: '1',
          email,
          name: email.split('@')[0],
        };

        set({ user: mockUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        usePaymentStore.getState().clearPurchases();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
