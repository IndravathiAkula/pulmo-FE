import { MainLayout } from "@/client/ui/layout/MainLayout";

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
