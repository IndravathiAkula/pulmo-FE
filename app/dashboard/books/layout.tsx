import { notFound } from "next/navigation";
import { getSession } from "@/server/auth/auth.session";

/**
 * /dashboard/books/* — author-only surface.
 *
 * The session is authenticated (middleware + parent dashboard layout
 * already checked). We additionally require `userType === "AUTHOR"`.
 * Non-authors get a 404 rather than a 403 to avoid leaking the
 * existence of the route.
 *
 * Admins do NOT get access here — admin moderation lives at
 * /dashboard/admin/books/* with a different surface.
 */
export default async function AuthorBooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isAuthenticated || session.user?.userType !== "AUTHOR") {
    notFound();
  }

  return <>{children}</>;
}
