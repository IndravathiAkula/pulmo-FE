"use client";

import { useActionState } from "react";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/features/auth/actions";

const initialState: ChangePasswordActionState = {
  success: false,
  message: "",
};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialState
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Server-side error */}
      {state.message && !state.success && !state.errors && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-[var(--color-error)]">
          {state.message}
        </div>
      )}

      {/* Current Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          Current Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showCurrent ? "text" : "password"}
            name="currentPassword"
            required
            placeholder="Enter current password"
            autoComplete="current-password"
            className="w-full pl-9 pr-10 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
              placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {showCurrent ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
        {state.errors?.currentPassword && (
          <p className="text-xs text-[var(--color-error)] px-1">
            {state.errors.currentPassword}
          </p>
        )}
      </div>

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showNew ? "text" : "password"}
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
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {showNew ? (
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

      {/* Confirm New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            required
            minLength={8}
            placeholder="Repeat new password"
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

      {/* Info note */}
      <p className="text-xs text-[var(--color-text-muted)] px-1">
        Changing your password will log you out of all devices.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary py-3.5 text-base font-bold mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            Changing…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5" /> Change Password
          </span>
        )}
      </button>
    </form>
  );
}
