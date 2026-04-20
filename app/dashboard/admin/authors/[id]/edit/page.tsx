import { permanentRedirect } from "next/navigation";

/**
 * Author editing now happens in a modal on /dashboard/admin/authors.
 * This route is preserved as a 308 redirect so any existing bookmarks,
 * tabs, or external links don't 404. We can drop it entirely once we
 * confirm no inbound links rely on it.
 */
export default function LegacyAuthorEditRedirect() {
  permanentRedirect("/dashboard/admin/authors");
}
