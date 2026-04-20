import { redirect } from "next/navigation";

/**
 * /dashboard always lands the user on /dashboard/profile —
 * see Phase 2 plan, Q-i. Profile is the universal anchor screen
 * for every role (READER, AUTHOR, ADMIN).
 */
export default function DashboardIndex() {
  redirect("/dashboard/profile");
}
