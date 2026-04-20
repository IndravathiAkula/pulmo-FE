"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/client/state/authStore';
import { usePaymentStore } from '@/client/state/paymentStore';

export function AuthNav() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { purchasedBooks } = usePaymentStore();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
        setMobileOpen(false);
    };

    return (
        <>
            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-2">
                {isAuthenticated ? (
                    <>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-body)]">
                            <ShoppingBag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            <span>{purchasedBooks.size} owned</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: 'var(--color-primary)' }}>
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-[var(--color-text-body)] font-medium">{user?.name}</span>
                        </div>

                        <button onClick={handleLogout}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-[var(--color-text-body)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-border-hover)]">
                            <LogOut className="w-3.5 h-3.5" />
                            Logout
                        </button>
                    </>
                ) : (
                    <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                        <LogIn className="w-4 h-4" />
                        Login
                    </Link>
                )}
            </nav>

            {/* Mobile hamburger */}
            <button className="sm:hidden p-2 rounded-lg text-[var(--color-text-body)] hover:bg-[var(--color-surface-alt)] transition-colors"
                onClick={() => setMobileOpen(o => !o)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="absolute top-16 left-0 right-0 sm:hidden border-t border-[var(--color-border)] px-4 py-3 space-y-2 animate-slide-up bg-white shadow-lg z-50">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-2 py-2 text-[var(--color-text-body)]">
                                <User className="w-4 h-4 text-[var(--color-primary)]" />
                                <span className="font-medium">{user?.name}</span>
                                <span className="ml-auto text-sm text-[var(--color-text-muted)]">{purchasedBooks.size} books owned</span>
                            </div>
                            <button onClick={handleLogout}
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-[var(--color-text-body)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-border-hover)] justify-center">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:shadow-lg w-full justify-center"
                            onClick={() => setMobileOpen(false)}>
                            <LogIn className="w-4 h-4" /> Login
                        </Link>
                    )}
                </div>
            )}
        </>
    );
}
