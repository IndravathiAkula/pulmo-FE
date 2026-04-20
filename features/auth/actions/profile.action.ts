"use server";

import { authService } from "@/server/auth/auth.service";
import { ApiError } from "@/server/api/errors";

export interface UpdateProfileActionState {
  success: boolean;
  message: string;
  errors?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    designation?: string;
    description?: string;
    qualification?: string;
  };
}

export async function updateProfileAction(
  _prevState: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const interests = formData.get("interests")?.toString().trim() ?? "";

  // Author-only fields — present only when the form is rendered for AUTHOR users
  const designation = formData.get("designation")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const qualification =
    formData.get("qualification")?.toString().trim() ?? "";
  // Profile image is uploaded via Pattern B (POST /uploads → URL → submit).
  // The form's <FileUpload kind="profile" name="profileUrl"> writes the
  // returned URL into this hidden input.
  const profileUrl =
    formData.get("profileUrl")?.toString().trim() ?? "";

  // ── Validation ───────────────────────────────────────────
  const errors: UpdateProfileActionState["errors"] = {};

  if (!firstName) errors.firstName = "First name is required";
  if (!lastName) errors.lastName = "Last name is required";

  if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    errors.phone = "Invalid phone number format";
  }

  if (description && description.length > 1000) {
    errors.description = "Description must be under 1000 characters";
  }

  if (qualification && qualification.length > 200) {
    errors.qualification = "Qualification must be under 200 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  try {
    const result = await authService.updateProfile({
      firstName,
      lastName,
      phone: phone || undefined,
      interests: interests || undefined,
      designation: designation || undefined,
      description: description || undefined,
      qualification: qualification || undefined,
      profileUrl: profileUrl || undefined,
    });

    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
