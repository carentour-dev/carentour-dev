import { NextRequest } from "next/server";
import { z } from "zod";

import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import { normalizeRoles, pickPrimaryRole } from "@/lib/auth/roles";

const sexOptions = [
  "female",
  "male",
  "non-binary",
  "prefer_not_to_say",
] as const;
const phoneRegex = /^[+0-9()[\]\s-]{6,}$/;

const updateStaffSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(120, "Name must be at most 120 characters long."),
  avatarUrl: z
    .string()
    .url("Upload a valid image.")
    .max(2048, "Avatar URL is too long.")
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.")
    .refine(
      (value) => {
        const parsed = new Date(value);
        return !Number.isNaN(parsed.getTime());
      },
      { message: "Enter a valid date." },
    ),
  nationality: z
    .string()
    .trim()
    .min(2, "Nationality must be at least 2 characters long.")
    .max(120, "Nationality must be at most 120 characters long."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters long.")
    .max(180, "Job title must be at most 180 characters long."),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 characters long.")
    .max(40, "Phone number must be at most 40 characters long.")
    .regex(
      phoneRegex,
      "Phone number can only include digits, spaces, parentheses, dashes, or '+'",
    ),
  sex: z.enum(sexOptions, {
    required_error: "Select the option that best matches their HR records.",
  }),
  language: z
    .string()
    .trim()
    .min(2, "Preferred language must be at least 2 characters long.")
    .max(80, "Preferred language must be at most 80 characters long."),
});

type ProfileRoleRecord = {
  role?: {
    slug?: string | null;
  } | null;
};

const STAFF_PROFILE_SELECT = `
  id,
  user_id,
  username,
  avatar_url,
  email,
  date_of_birth,
  nationality,
  job_title,
  phone,
  language,
  sex,
  created_at,
  updated_at,
  profile_roles:profile_roles(
    role:roles(
      slug,
      name
    )
  )
`;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const profileId = getRouteParam(ctx.params, "id");
  const payload = updateStaffSchema.parse(await req.json());

  const supabaseAdmin = getSupabaseAdmin();

  const { data: profileRecord, error: profileFetchError } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileFetchError && profileFetchError.code !== "PGRST116") {
    throw new ApiError(
      500,
      "Failed to load the staff account.",
      profileFetchError.message,
    );
  }

  if (!profileRecord) {
    throw new ApiError(404, "Staff account not found.");
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({
      username: payload.displayName,
      avatar_url: payload.avatarUrl ?? null,
      date_of_birth: payload.dateOfBirth,
      nationality: payload.nationality,
      job_title: payload.jobTitle,
      phone: payload.phone,
      sex: payload.sex,
      language: payload.language,
    })
    .eq("id", profileId);

  if (profileUpdateError) {
    throw new ApiError(
      500,
      "Failed to update the staff profile.",
      profileUpdateError.message,
    );
  }

  const { error: metadataUpdateError } =
    await supabaseAdmin.auth.admin.updateUserById(profileRecord.user_id, {
      user_metadata: {
        username: payload.displayName,
        full_name: payload.displayName,
        avatar_url: payload.avatarUrl ?? null,
        date_of_birth: payload.dateOfBirth,
        nationality: payload.nationality,
        job_title: payload.jobTitle,
        phone: payload.phone,
        sex: payload.sex,
        language: payload.language,
      },
    });

  if (metadataUpdateError) {
    throw new ApiError(
      500,
      "Failed to update the staff member metadata.",
      metadataUpdateError.message,
    );
  }

  const { data: refreshedProfile, error: refreshedProfileError } =
    await supabaseAdmin
      .from("profiles")
      .select(STAFF_PROFILE_SELECT)
      .eq("id", profileId)
      .maybeSingle();

  if (refreshedProfileError) {
    throw new ApiError(
      500,
      "Failed to load the updated staff account.",
      refreshedProfileError.message,
    );
  }

  if (!refreshedProfile) {
    throw new ApiError(404, "Unable to load the updated staff account.");
  }

  const assignedRoles = normalizeRoles(
    (
      refreshedProfile.profile_roles as ProfileRoleRecord[] | null | undefined
    )?.map((record) => record?.role?.slug ?? "") ?? [],
  );

  return jsonResponse({
    account: {
      id: refreshedProfile.id,
      user_id: refreshedProfile.user_id,
      username: refreshedProfile.username,
      avatar_url: refreshedProfile.avatar_url,
      email: refreshedProfile.email,
      date_of_birth: refreshedProfile.date_of_birth,
      nationality: refreshedProfile.nationality,
      job_title: refreshedProfile.job_title,
      phone: refreshedProfile.phone,
      language: refreshedProfile.language,
      sex: refreshedProfile.sex,
      roles: assignedRoles,
      primary_role: pickPrimaryRole(assignedRoles),
      created_at: refreshedProfile.created_at,
      updated_at: refreshedProfile.updated_at,
    },
  });
});
