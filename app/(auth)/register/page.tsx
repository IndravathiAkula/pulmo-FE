import { BookOpen } from "lucide-react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { AuthSplitLayout } from "@/client/ui/layout/AuthSplitLayout";

export default function RegisterPage() {
  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--color-primary)" }}
        >
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-main)]">
          Create Account
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Join the medical literature platform
        </p>
      </div>

      <RegisterForm />
    </AuthSplitLayout>
  );
}
