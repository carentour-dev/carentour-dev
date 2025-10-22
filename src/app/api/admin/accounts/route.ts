import { z } from "zod";

import { jsonResponse, handleRouteError } from "@/server/utils/http";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import { normalizeRoles, pickPrimaryRole } from "@/lib/auth/roles";

const createAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(120, "Name must be at most 120 characters long.")
    .optional(),
  roles: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Role slug cannot be empty.")
        .transform((value) => value.toLowerCase()),
    )
    .min(1, "Select at least one role."),
});

type RoleRecord = {
  id: string;
  slug: string;
  name: string;
};

type ProfileRoleRecord = {
  role?: RoleRecord | null;
};

function resolveInviteRedirectUrl(): string | null {
  const explicit = process.env.TEAM_ACCOUNT_INVITE_REDIRECT_URL?.trim() ?? "";
  if (explicit.length > 0) {
    return explicit;
  }

  const adminConsoleBase = process.env.ADMIN_CONSOLE_URL?.trim() ?? "";
  if (adminConsoleBase.length === 0) {
    return null;
  }

  const normalizedBase = adminConsoleBase.replace(/\/+$/, "");
  if (/\/staff\/onboarding$/i.test(normalizedBase)) {
    return normalizedBase;
  }

  return `${normalizedBase}/staff/onboarding`;
}

function extractFunctionsErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    const contextBody = (error as { context?: { body?: unknown } }).context
      ?.body;
    if (contextBody) {
      try {
        const parsed =
          typeof contextBody === "string"
            ? JSON.parse(contextBody)
            : contextBody;

        if (parsed && typeof parsed === "object") {
          const parsedError = (parsed as { error?: unknown }).error;
          if (
            typeof parsedError === "string" &&
            parsedError.trim().length > 0
          ) {
            return parsedError;
          }

          if (parsedError && typeof parsedError === "object") {
            const nestedMessage = (parsedError as { message?: unknown })
              .message;
            if (
              typeof nestedMessage === "string" &&
              nestedMessage.trim().length > 0
            ) {
              return nestedMessage;
            }
          }

          const parsedMessage = (parsed as { message?: unknown }).message;
          if (
            typeof parsedMessage === "string" &&
            parsedMessage.trim().length > 0
          ) {
            return parsedMessage;
          }

          if (parsedMessage && typeof parsedMessage === "object") {
            const nestedMessage = (parsedMessage as { message?: unknown })
              .message;
            if (
              typeof nestedMessage === "string" &&
              nestedMessage.trim().length > 0
            ) {
              return nestedMessage;
            }
          }
        }
      } catch {
        // Ignore JSON parsing errors and fall back to generic message
      }
    }
  }

  return "Unknown email service error.";
}

export async function GET() {
  try {
    await requireRole(["admin"]);

    const supabaseAdmin = getSupabaseAdmin();

    const [rolesResult, profilesResult] = await Promise.all([
      supabaseAdmin
        .from("roles")
        .select("id, slug, name, description")
        .order("slug", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            user_id,
            username,
            email,
            created_at,
            updated_at,
            profile_roles:profile_roles(
              role:roles(
                id,
                slug,
                name
              )
            )
          `,
        )
        .order("created_at", { ascending: false }),
    ]);

    if (rolesResult.error) {
      throw new ApiError(
        500,
        "Failed to load available roles.",
        rolesResult.error.message,
      );
    }

    if (profilesResult.error) {
      throw new ApiError(
        500,
        "Failed to load profiles.",
        profilesResult.error.message,
      );
    }

    const roles =
      (rolesResult.data ?? []).map((role) => ({
        id: role.id,
        slug: role.slug,
        name: role.name,
        description: role.description ?? null,
      })) ?? [];

    const staffAccounts = (profilesResult.data ?? [])
      .map((profile) => {
        const assignedRoles = normalizeRoles(
          (
            profile.profile_roles as ProfileRoleRecord[] | null | undefined
          )?.map((record) => record?.role?.slug ?? "") ?? [],
        );
        const nonUserRoles = assignedRoles.filter(
          (slug) => slug && slug !== "user",
        );

        return {
          id: profile.id,
          user_id: profile.user_id,
          username: profile.username,
          email: profile.email,
          roles: assignedRoles,
          primary_role: pickPrimaryRole(assignedRoles),
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          is_team_account: nonUserRoles.length > 0,
        };
      })
      .filter((profile) => profile.is_team_account);

    return jsonResponse({
      roles,
      accounts: staffAccounts.map(({ is_team_account, ...account }) => account),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { roles: requestedRolesInput, ...payload } =
      createAccountSchema.parse(await request.json());

    const authContext = await requireRole(["admin"]);
    const supabaseAdmin = getSupabaseAdmin();

    const normalizedRoles = normalizeRoles(requestedRolesInput);

    if (!normalizedRoles.length) {
      throw new ApiError(422, "Select at least one role for the new account.");
    }

    const hasOnlyUserRole = normalizedRoles.every((role) => role === "user");
    if (hasOnlyUserRole) {
      throw new ApiError(
        422,
        "Team accounts require at least one elevated role.",
      );
    }

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", payload.email)
        .maybeSingle();

    if (existingProfileError && existingProfileError.code !== "PGRST116") {
      throw new ApiError(
        500,
        "Failed to verify whether the account already exists.",
        existingProfileError.message,
      );
    }

    if (existingProfile) {
      throw new ApiError(
        409,
        "An account with this email already exists. Update roles from the Access page instead of creating a duplicate.",
      );
    }

    const { data: roleRecords, error: roleFetchError } = await supabaseAdmin
      .from("roles")
      .select("id, slug, name")
      .in("slug", normalizedRoles);

    if (roleFetchError) {
      throw new ApiError(
        500,
        "Failed to load role catalog.",
        roleFetchError.message,
      );
    }

    const foundSlugs = new Set((roleRecords ?? []).map((role) => role.slug));
    const missingRoles = normalizedRoles.filter(
      (slug) => !foundSlugs.has(slug),
    );

    if (missingRoles.length) {
      throw new ApiError(
        400,
        `Unknown role${missingRoles.length > 1 ? "s" : ""}: ${missingRoles.join(", ")}`,
      );
    }

    const inviteRedirectUrl = resolveInviteRedirectUrl();

    if (!inviteRedirectUrl) {
      throw new ApiError(
        500,
        "TEAM_ACCOUNT_INVITE_REDIRECT_URL or ADMIN_CONSOLE_URL must be configured. Set one of them so invites can redirect staff to the onboarding experience.",
      );
    }

    const staffMetadata: Record<string, unknown> = {
      account_type: "staff",
      staff_roles: normalizedRoles,
      invited_via_admin_console: true,
      invited_by: authContext.user.id,
      staff_onboarding_redirect: inviteRedirectUrl,
    };

    if (payload.name && payload.name.length > 0) {
      staffMetadata.username = payload.name;
    }

    // Create user with staff metadata (not confirmed yet - they need to set password)
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        email_confirm: false,
        user_metadata: staffMetadata,
      });

    if (inviteError) {
      const message =
        inviteError.message ??
        "Supabase did not accept the user creation request.";

      if (
        /already exists/i.test(message) ||
        /already registered/i.test(message)
      ) {
        throw new ApiError(
          409,
          "An account with this email already exists. Update roles from the Access page instead of creating a duplicate.",
        );
      }

      throw new ApiError(500, "Failed to create the team account.", message);
    }

    const newUserId = inviteData?.user?.id;

    if (!newUserId) {
      throw new ApiError(
        500,
        "Supabase did not return an identifier for the new user account.",
      );
    }

    // Generate magic link for staff onboarding (password setup)
    const { data: magicLinkData, error: magicLinkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: payload.email,
        options: {
          redirectTo: inviteRedirectUrl,
        },
      });

    if (magicLinkError || !magicLinkData.properties?.action_link) {
      // Rollback: delete the user if magic link generation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      throw new ApiError(
        500,
        "Failed to generate invitation link.",
        magicLinkError?.message,
      );
    }

    const inviteUrl = magicLinkData.properties.action_link;

    // Send custom staff invite email via Edge Function
    const { error: emailError } = await supabaseAdmin.functions.invoke(
      "send-staff-invite",
      {
        body: {
          email: payload.email,
          inviteUrl,
          inviterName: authContext.user.email?.split("@")[0] || "Admin",
          staffName: payload.name || payload.email.split("@")[0],
          roles: normalizedRoles,
        },
      },
    );

    if (emailError) {
      console.error("Failed to send staff invite email:", emailError);
      // Rollback: delete the user if email fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      const emailErrorMessage = extractFunctionsErrorMessage(emailError);
      throw new ApiError(
        500,
        "Failed to send invitation email.",
        emailErrorMessage,
      );
    }

    let profileId: string | null = null;
    let profileUsername = payload.name ?? null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, username")
        .eq("user_id", newUserId)
        .single();

      if (!profileError && profileData) {
        profileId = profileData.id;
        profileUsername = profileData.username ?? profileUsername;
        break;
      }

      if (profileError?.code !== "PGRST116") {
        throw new ApiError(
          500,
          "Failed to create the user profile for the new account.",
          profileError?.message ?? undefined,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (!profileId) {
      throw new ApiError(
        500,
        "Timed out waiting for the user profile to be created.",
      );
    }

    const profileUpdates: Record<string, unknown> = {
      email: payload.email,
    };

    if (payload.name) {
      profileUpdates.username = payload.name;
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdates)
      .eq("id", profileId);

    if (profileUpdateError) {
      throw new ApiError(
        500,
        "Failed to finalize the new team profile.",
        profileUpdateError.message,
      );
    }

    if (roleRecords && roleRecords.length > 0) {
      const roleAssignments = roleRecords.map((role) => ({
        profile_id: profileId,
        role_id: role.id,
        assigned_by: authContext.user.id,
      }));

      const { error: roleInsertError } = await supabaseAdmin
        .from("profile_roles")
        .upsert(roleAssignments, { onConflict: "profile_id,role_id" });

      if (roleInsertError) {
        throw new ApiError(
          500,
          "Failed to assign roles to the new account.",
          roleInsertError.message,
        );
      }
    }

    const { data: enrichedProfile, error: enrichedProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
          id,
          user_id,
          username,
          email,
          created_at,
          updated_at,
          profile_roles:profile_roles(
            role:roles(
              slug,
              name
            )
          )
        `,
        )
        .eq("id", profileId)
        .single();

    if (enrichedProfileError) {
      throw new ApiError(
        500,
        "Failed to load the newly created account.",
        enrichedProfileError.message,
      );
    }

    const assignedRoles = normalizeRoles(
      (
        enrichedProfile.profile_roles as ProfileRoleRecord[] | null | undefined
      )?.map((record) => record?.role?.slug ?? "") ?? [],
    );

    return jsonResponse(
      {
        account: {
          id: enrichedProfile.id,
          user_id: enrichedProfile.user_id,
          username:
            enrichedProfile.username ??
            profileUsername ??
            payload.email.split("@")[0],
          email: enrichedProfile.email,
          roles: assignedRoles,
          primary_role: pickPrimaryRole(assignedRoles),
          created_at: enrichedProfile.created_at,
          updated_at: enrichedProfile.updated_at,
        },
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
