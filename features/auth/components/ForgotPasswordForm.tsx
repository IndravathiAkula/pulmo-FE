"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/features/auth/actions";

const initialState: ForgotPasswordActionState = {
  success: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  // Show success state
  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
          <Send className="w-7 h-7 text-[var(--color-success)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-main)]">Check your email</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-sm">
          {state.message}
        </p>
        <Link
          href="/login"
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors mt-2"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      {/* Server-side error */}
      {state.message && !state.success && !state.errors && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-[var(--color-error)]">
          {state.message}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
              placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm"
          />
        </div>
        {state.errors?.email && (
          <p className="text-xs text-[var(--color-error)] px-1">{state.errors.email}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary py-3.5 text-base font-bold mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            Sending…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send className="w-5 h-5" /> Send Reset Link
          </span>
        )}
      </button>

      {/* Back to login */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-2">
        <Link
          href="/login"
          className="text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors"
        >
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Back to login
        </Link>
      </p>
    </form>
  );
}
