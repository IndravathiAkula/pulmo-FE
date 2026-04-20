import { MainLayout } from "@/client/ui/layout/MainLayout";

/**
 * /cart sits at the top level (not inside the dashboard) but still
 * needs the global navbar + footer chrome. Wrap it in MainLayout.
 */
export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
