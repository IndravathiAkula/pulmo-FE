import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { VerifyEmailHandler } from "@/features/auth/components/VerifyEmailHandler";

export default function VerifyEmailPage() {
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
              Email Verification
            </h1>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
              </div>
            }
          >
            <VerifyEmailHandler />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
