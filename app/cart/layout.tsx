import { MainLayout } from "@/client/ui/layout/MainLayout";

/**
 * /cart sits at the top level (not inside the dashboard) but still
 * needs the global navbar + footer chrome. Wrap it in MainLayout.
 *
 * `force-dynamic` because the cart page reads the authenticated user's
 * cart from the backend — never safe to prerender at build time.
 */
export const dynamic = "force-dynamic";

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
