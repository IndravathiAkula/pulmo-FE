import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/server/auth/auth.session";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  // Server-side auth guard — redirect to login if not authenticated
  const session = await getSession();
  if (!session.isAuthenticated) {
    redirect("/login?returnTo=/change-password");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-surface)]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #2563EB, #3B82F6)",
          }}
        />
      </div>

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <div className="bg-white border border-[var(--color-border)] p-8 rounded-2xl shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--color-primary)" }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-main)]">
              Change Password
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Signed in as{" "}
              <span className="text-[var(--color-text-body)]">{session.user?.email}</span>
            </p>
          </div>

          <ChangePasswordForm />

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors font-bold"
            >
              &larr; Return to Medical Library
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
