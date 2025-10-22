import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import { normalizeRoles, pickPrimaryRole, RoleSlug } from "@/lib/auth/roles";

export type AuthorizationContext = {
  user: User;
  roles: RoleSlug[];
  permissions: string[];
  primaryRole: RoleSlug | null;
};

async function resolveAuthorization(): Promise<AuthorizationContext> {
  const authHeader = (await headers()).get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const accessToken = authHeader.slice(7).trim();

  if (!accessToken) {
    throw new ApiError(401, "Missing access token");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new ApiError(401, "Invalid or expired token", userError?.message);
  }

  const [rolesResult, permissionsResult] = await Promise.all([
    supabaseAdmin.rpc("user_roles", { p_user_id: userData.user.id }),
    supabaseAdmin.rpc("user_permissions", { p_user_id: userData.user.id }),
  ]);

  if (rolesResult.error) {
    throw new ApiError(
      500,
      "Failed to load user roles",
      rolesResult.error.message,
    );
  }

  if (permissionsResult.error) {
    throw new ApiError(
      500,
      "Failed to load user permissions",
      permissionsResult.error.message,
    );
  }

  const roles = normalizeRoles(rolesResult.data);
  const permissions = Array.isArray(permissionsResult.data)
    ? [...new Set(permissionsResult.data)]
    : [];

  const primaryRole = pickPrimaryRole(roles);

  return {
    user: userData.user,
    roles,
    permissions,
    primaryRole,
  };
}

export async function requireAdmin(): Promise<AuthorizationContext> {
  return requireRole(["admin"]);
}

export async function requireRole(
  allowed: RoleSlug[],
): Promise<AuthorizationContext> {
  const context = await resolveAuthorization();

  if (!allowed.some((role) => context.roles.includes(role))) {
    throw new ApiError(403, "Insufficient privileges");
  }

  return context;
}

export async function requirePermission(
  permission: string | string[],
): Promise<AuthorizationContext> {
  const required = Array.isArray(permission) ? permission : [permission];
  const context = await resolveAuthorization();

  const hasPermission = required.every((perm) =>
    context.permissions.includes(perm),
  );

  if (!hasPermission) {
    throw new ApiError(403, "Permission denied");
  }

  return context;
}
