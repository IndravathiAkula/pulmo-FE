import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/auth.session";
import { authService } from "@/server/auth/auth.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { ProfilePage } from "@/features/auth/components/ProfilePage";

/**
 * /dashboard/profile — the canonical profile screen for every role.
 *
 * Middleware has already gated unauthenticated traffic, but the
 * defensive `redirect` below covers the rare case where the session
 * cookie expires between middleware and this server render.
 */
export default async function DashboardProfileRoute() {
  const session = await getSession();
  if (!session.isAuthenticated) {
    redirect("/login?from=/dashboard/profile");
  }

  // Fetch full profile from backend (includes phone, interests, author fields)
  const result = await authService.getProfile();

  const userType = session.user?.userType ?? "READER";

  const profileData = result.ok
    ? {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        phone: result.data.phone ?? "",
        interests: result.data.interests ?? "",
        // Backend canonical field is `profileUrl` (uploaded via Pattern B
        // through POST /uploads, kind=profile). Fall back to legacy
        // `imageUrl` if a stale row still has it set.
        profileUrl:
          resolveFileUrl(result.data.profileUrl) ??
          resolveFileUrl(result.data.imageUrl) ??
          "",
        description: result.data.description ?? "",
        designation: result.data.designation ?? "",
        qualification: result.data.qualification ?? "",
      }
    : {
        // Fallback to session data if profile API fails
        firstName: session.user?.firstName ?? "",
        lastName: session.user?.lastName ?? "",
        email: session.user?.email ?? "",
        phone: "",
        interests: "",
        profileUrl: "",
        description: "",
        designation: "",
        qualification: "",
      };

  return <ProfilePage user={profileData} userType={userType} />;
}
