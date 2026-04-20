"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "@/features/auth/actions";

const initialState: ResetPasswordActionState = {
  success: false,
  message: "",
};

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialState
  );
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-[var(--color-error)]" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-main)]">Invalid Reset Link</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Hidden token */}
      <input type="hidden" name="token" value={token} />

      {/* Server-side error */}
      {state.message && !state.success && !state.errors && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-[var(--color-error)]">
          {state.message}
        </div>
      )}

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showPass ? "text" : "password"}
            name="newPassword"
            required
            minLength={8}
            placeholder="Min 8 characters"
            autoComplete="new-password"
            onChange={(e) => setNewPassword(e.target.value)}
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
        {state.errors?.newPassword && (
          <p className="text-xs text-[var(--color-error)] px-1">
            {state.errors.newPassword}
          </p>
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
        {passwordMismatch && (
          <p className="text-xs text-[var(--color-error)] px-1">Passwords do not match</p>
        )}
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
            Resetting…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5" /> Reset Password
          </span>
        )}
      </button>
    </form>
  );
}
