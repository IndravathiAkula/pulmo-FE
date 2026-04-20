import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthSplitLayout } from "@/client/ui/layout/AuthSplitLayout";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: "var(--color-primary)" }}
        >
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-main)]">
          Welcome Back
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Sign in to your account
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center px-8 py-4">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
