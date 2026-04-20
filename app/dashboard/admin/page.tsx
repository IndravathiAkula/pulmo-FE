import { redirect } from "next/navigation";

/**
 * /dashboard/admin lands the admin on the Pending review queue —
 * that's the most common reason an admin opens this surface.
 */
export default function AdminIndex() {
  redirect("/dashboard/admin/books?tab=pending");
}
