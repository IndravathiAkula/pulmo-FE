import { notFound } from "next/navigation";
import { getSession } from "@/server/auth/auth.session";

/**
 * /dashboard/admin/* — admin-only surface.
 *
 * Session is already authenticated (middleware + parent dashboard
 * layout). We additionally require `roles` to include "ADMIN".
 * Non-admins get a 404 (not 403) so the route's existence isn't
 * leaked to non-admin users.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (
    !session.isAuthenticated ||
    !session.user ||
    !session.user.roles.includes("ADMIN")
  ) {
    notFound();
  }

  return <>{children}</>;
}
