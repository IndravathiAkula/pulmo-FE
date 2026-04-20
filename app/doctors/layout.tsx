import { MainLayout } from "@/client/ui/layout/MainLayout";

export default function DoctorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
