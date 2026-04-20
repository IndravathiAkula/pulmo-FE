"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { loginAction, type LoginActionState } from "@/features/auth/actions";

const initialState: LoginActionState = { success: false, message: "" };

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const urlMessage = searchParams.get("message");

  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPass, setShowPass] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Hidden returnTo for the server action */}
      <input type="hidden" name="returnTo" value={returnTo} />

      {/* URL-based success message (e.g. after password reset) */}
      {urlMessage && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-[var(--color-success)]">
          {urlMessage}
        </div>
      )}

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

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showPass ? "text" : "password"}
            name="password"
            required
            minLength={8}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full pl-9 pr-10 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
              placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {showPass ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
        {state.errors?.password && (
          <p className="text-xs text-[var(--color-error)] px-1">{state.errors.password}</p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors font-medium"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary py-3.5 text-base font-bold mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Sign In
          </span>
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-2">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
