import { MainLayout } from "@/client/ui/layout/MainLayout";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
