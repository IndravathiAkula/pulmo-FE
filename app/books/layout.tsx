import { MainLayout } from "@/client/ui/layout/MainLayout";

export default function BooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
