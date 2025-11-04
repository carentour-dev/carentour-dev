import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import { normalizeRoles } from "@/lib/auth/roles";

const TEAM_MEMBER_PERMISSIONS = {
  allPermissions: ["operations.shared"],
} as const;

type RawProfile = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
  profile_roles: Array<{
    role: {
      slug: string;
      name: string | null;
    } | null;
  }> | null;
};

type TeamMember = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  roles: string[];
};

export const GET = adminRoute(async () => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        username,
        email,
        avatar_url,
        job_title,
        profile_roles:profile_roles(
          role:roles(
            slug,
            name
          )
        )
      `,
    )
    .order("username", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "Failed to load team members",
      error.message ?? undefined,
    );
  }

  const members: TeamMember[] =
    (data as RawProfile[] | null)?.flatMap((profile) => {
      if (!profile) return [];

      const roles =
        normalizeRoles(
          (profile.profile_roles ?? [])
            .map((entry) => entry?.role?.slug ?? null)
            .filter((slug): slug is string => Boolean(slug)),
        ) ?? [];

      const nonUserRoles = roles.filter((slug) => slug !== "user");
      if (nonUserRoles.length === 0) {
        return [];
      }

      const displayName =
        profile.username?.trim() ||
        profile.email?.split("@")[0]?.trim() ||
        "Team member";

      return [
        {
          id: profile.id,
          displayName,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          jobTitle: profile.job_title,
          roles: roles.length > 0 ? roles : ["user"],
        },
      ];
    }) ?? [];

  members.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    }),
  );

  return jsonResponse(members);
}, TEAM_MEMBER_PERMISSIONS);
