"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  registerAction,
  type RegisterActionState,
} from "@/features/auth/actions";

const initialState: RegisterActionState = { success: false, message: "" };

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Server-side error */}
      {state.message && !state.success && !state.errors && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-[var(--color-error)]">
          {state.message}
        </div>
      )}

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              name="firstName"
              required
              placeholder="John"
              autoComplete="given-name"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
                placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm"
            />
          </div>
          {state.errors?.firstName && (
            <p className="text-xs text-[var(--color-error)] px-1">
              {state.errors.firstName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              name="lastName"
              required
              placeholder="Doe"
              autoComplete="family-name"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
                placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm"
            />
          </div>
          {state.errors?.lastName && (
            <p className="text-xs text-[var(--color-error)] px-1">
              {state.errors.lastName}
            </p>
          )}
        </div>
      </div>

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
            placeholder="Min 8 characters"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
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

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            required
            minLength={8}
            placeholder="Repeat your password"
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-9 pr-10 py-3 rounded-xl bg-white border text-[var(--color-text-main)]
              placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm ${
                passwordMismatch ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"
              }`}
          />
          {passwordMismatch && (
            <p className="text-xs text-[var(--color-error)] px-1 mt-1">Passwords do not match</p>
          )}
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {showConfirm ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
        {state.errors?.confirmPassword && (
          <p className="text-xs text-[var(--color-error)] px-1">
            {state.errors.confirmPassword}
          </p>
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
            Creating account…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> Create Account
          </span>
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
