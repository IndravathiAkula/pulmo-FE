/**
 * Dashboard layout — full-width structure with a left-edge sidebar.
 *
 * Structure on desktop (lg+):
 *   ┌──────────────── NavigationBar ────────────────┐
 *   ├────────┬─────────────────────────────────────────┤
 *   │Sidebar │         Content area                  │
 *   │(white) │   (scrollable, padded, max-width)     │
 *   │        │                                       │
 *   ├────────┴─────────────────────────────────────────┤
 *   └──────────────────── Footer ──────────────────────┘
 *
 * The sidebar sits at the very left edge of the screen, NOT inside
 * a max-width container, so it feels like a true app rail.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/auth.session";
import { NavigationBar } from "@/client/ui/navigation/NavigationBar";
import { Footer } from "@/client/ui/layout/Footer";
import {
  DashboardSidebar,
  type SidebarSection,
} from "@/client/ui/dashboard/DashboardSidebar";

function buildSidebar(opts: {
  isAuthor: boolean;
  isAdmin: boolean;
}): { sections: SidebarSection[] } {
  const { isAuthor, isAdmin } = opts;

  const sections: SidebarSection[] = [
    {
      title: "Account",
      items: [
        { label: "My Profile", href: "/dashboard/profile", icon: "user" },
        { label: "My Library", href: "/dashboard/library", icon: "library" },
        { label: "Order History", href: "/dashboard/orders", icon: "receipt" },
      ],
    },
  ];

  if (isAuthor) {
    sections.push({
      title: "Author",
      items: [
        { label: "My Books", href: "/dashboard/books", icon: "bookOpen" },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "Admin",
      items: [
        {
          label: "Book Moderation",
          href: "/dashboard/admin/books",
          icon: "clipboardCheck",
        },
        {
          label: "Authors",
          href: "/dashboard/admin/authors",
          icon: "users",
        },
        {
          label: "Categories",
          href: "/dashboard/admin/categories",
          icon: "tags",
        },
      ],
    });
  }

  return { sections };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isAuthenticated || !session.user) {
    redirect("/login?from=/dashboard");
  }

  const isAuthor = session.user.userType === "AUTHOR";
  const isAdmin = session.user.roles.includes("ADMIN");
  const { sections } = buildSidebar({ isAuthor, isAdmin });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top navbar — full width */}
      <NavigationBar />

      {/* Body — sidebar + content side by side */}
      <div className="flex-1 flex flex-col lg:flex-row py-4">
        <DashboardSidebar sections={sections} />

        {/* Content area — scrollable, padded, constrained.
            `min-h-[calc(100dvh-10rem)]` gives every dashboard page a
            consistent baseline height (viewport minus navbar, footer,
            and the wrapper's `py-4`) so short pages still look full
            and the footer stays at the bottom. */}
        <main className="flex-1 min-w-0 px-6 lg:px-8 2xl:px-12 py-6 min-h-[calc(100dvh-6rem)] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Footer — full width */}
      <Footer />
    </div>
  );
}
