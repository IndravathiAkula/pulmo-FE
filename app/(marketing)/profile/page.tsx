import { permanentRedirect } from "next/navigation";

/**
 * /profile is preserved as a permanent (308) redirect to the new
 * canonical location at /dashboard/profile. Keeps existing bookmarks
 * and email links working after the move into the dashboard shell.
 */
export default function LegacyProfileRedirect() {
  permanentRedirect("/dashboard/profile");
}
