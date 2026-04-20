"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Lock, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/client/state/authStore';
import { usePaymentStore } from '@/client/state/paymentStore';
import { useAccessControl } from '@/features/auth/hooks/useAccessControl';
import type { Book } from '@/app/data/books';

export function PurchaseSection({ book }: { book: Book }) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { purchaseBook } = usePaymentStore();
    const { canReadFull } = useAccessControl();

    const [purchasing, setPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    const fullAccess = canReadFull(book.id);

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            router.push(`/login?returnTo=/books/${book.id}`);
            return;
        }
        setPurchasing(true);
        await purchaseBook(book.id);
        setPurchasing(false);
        setPurchaseSuccess(true);
    };

    if (fullAccess) {
        return (
            <button
                onClick={() => router.push(`/reader/${book.id}`)}
                className="btn-primary px-4 py-3.5 text-base font-bold w-full">
                <BookOpen className="w-5 h-5" />
                Read Full Book
                <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
        );
    }

    if (purchaseSuccess) {
        return (
            <div className="rounded-2xl p-5 text-center border border-green-200 bg-green-50 animate-scale-in">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-bold text-[var(--color-success)] text-lg">Purchase Successful!</p>
                <button
                    onClick={() => router.push(`/reader/${book.id}`)}
                    className="btn-primary mt-4 py-3 w-full font-bold">
                    <BookOpen className="w-5 h-5" /> Open Secure Reader
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-[var(--color-text-body)] text-sm">Full content is locked</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Purchase to unlock all {book.pageCount} pages.
                    </p>
                </div>
            </div>
            {!isAuthenticated && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5 animate-fade-in">
                    <span>⚠</span> You must be logged in to purchase.
                </p>
            )}
            <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="btn-primary py-3 text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {purchasing ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                        Processing…
                    </span>
                ) : (
                    <>
                        <ShoppingCart className="w-5 h-5" />
                        {isAuthenticated ? `Buy for $${book.price}` : 'Login to Purchase'}
                    </>
                )}
            </button>
        </div>
    );
}
