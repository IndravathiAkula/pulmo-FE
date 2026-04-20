import { MainLayout } from "@/client/ui/layout/MainLayout";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
