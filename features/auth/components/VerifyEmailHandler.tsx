"use client";

import { useEffect, useState, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { verifyEmailAction } from "@/features/auth/actions/verify-email.action";
import {
  resendVerificationAction,
  type ResendVerificationActionState,
} from "@/features/auth/actions/verify-email.action";

const resendInitialState: ResendVerificationActionState = {
  success: false,
  message: "",
};

export function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [verifyState, setVerifyState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    resendInitialState
  );

  // Auto-verify if token is present
  useEffect(() => {
    if (!token) return;

    setVerifyState({ status: "loading", message: "Verifying your email..." });

    verifyEmailAction(token).then((result) => {
      if (result.success) {
        setVerifyState({
          status: "success",
          message: result.message,
        });
      } else {
        setVerifyState({
          status: "error",
          message: result.message,
        });
      }
    });
  }, [token]);

  // ── Token present: show verification status ──────────────
  if (token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {verifyState.status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
            <p className="text-[var(--color-text-muted)]">{verifyState.message}</p>
          </>
        )}

        {verifyState.status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Email Verified!</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{verifyState.message}</p>
            <Link
              href="/login"
              className="btn-primary px-8 py-3 text-sm font-bold mt-4"
            >
              Continue to Login
            </Link>
          </>
        )}

        {verifyState.status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">
              Verification Failed
            </h2>
            <p className="text-sm text-[var(--color-error)]">{verifyState.message}</p>
            <Link
              href="/login"
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors mt-2"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    );
  }

  // ── No token: show "check your email" + resend form ──────
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 flex items-center justify-center">
        <Mail className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-text-main)]">Check Your Email</h2>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-sm">
        We&apos;ve sent a verification link to{" "}
        {email ? (
          <span className="text-[var(--color-text-main)] font-semibold">{email}</span>
        ) : (
          "your email address"
        )}
        . Click the link to verify your account.
      </p>

      {/* Resend section */}
      <div className="w-full mt-4 pt-4 border-t border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          Didn&apos;t receive the email?
        </p>

        {resendState.success ? (
          <p className="text-sm text-[var(--color-success)]">{resendState.message}</p>
        ) : (
          <form action={resendAction} className="flex flex-col gap-3">
            <input
              type="hidden"
              name="email"
              value={email ?? ""}
            />
            {!email && (
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-main)]
                  placeholder-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 text-sm text-center"
              />
            )}
            {resendState.message && !resendState.success && (
              <p className="text-xs text-[var(--color-error)]">{resendState.message}</p>
            )}
            <button
              type="submit"
              disabled={resendPending}
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-semibold transition-colors disabled:opacity-50"
            >
              {resendPending ? "Sending..." : "Resend verification email"}
            </button>
          </form>
        )}
      </div>

      <Link
        href="/login"
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors mt-2"
      >
        Back to Login
      </Link>
    </div>
  );
}
