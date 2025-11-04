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
  profileId: string | null;
  hasRole: (role: RoleSlug) => boolean;
  hasAnyRole: (roles: RoleSlug[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

const ADMIN_PERMISSION = "admin.access";

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

  const [rolesResult, permissionsResult, profileResult] = await Promise.all([
    supabaseAdmin.rpc("user_roles", { p_user_id: userData.user.id }),
    supabaseAdmin.rpc("user_permissions", { p_user_id: userData.user.id }),
    supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle(),
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
  const profileId = profileResult.data?.id ?? null;

  return {
    user: userData.user,
    roles,
    permissions,
    primaryRole,
    profileId,
    hasRole: (role: RoleSlug) => roles.includes(role),
    hasAnyRole: (allowed: RoleSlug[]) =>
      allowed.some((role) => roles.includes(role)),
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAnyPermission: (required: string[]) =>
      required.some((permission) => permissions.includes(permission)),
  };
}

export async function requireAdmin(): Promise<AuthorizationContext> {
  const context = await resolveAuthorization();

  if (!context.hasPermission(ADMIN_PERMISSION)) {
    throw new ApiError(403, "Admin access required");
  }

  return context;
}

export type BackofficeAccessOptions = {
  allPermissions?: readonly string[];
  anyPermissions?: readonly string[];
};

export async function requireBackofficeAccess(
  options: BackofficeAccessOptions,
): Promise<AuthorizationContext> {
  const context = await resolveAuthorization();

  if (context.hasPermission(ADMIN_PERMISSION)) {
    return context;
  }

  const requiredAll = options.allPermissions ?? [];
  const requiredAny = options.anyPermissions ?? [];

  if (
    requiredAll.length > 0 &&
    !requiredAll.every((permission) => context.hasPermission(permission))
  ) {
    throw new ApiError(403, "Permission denied");
  }

  if (
    requiredAny.length > 0 &&
    !requiredAny.some((permission) => context.hasPermission(permission))
  ) {
    throw new ApiError(403, "Permission denied");
  }

  if (requiredAll.length === 0 && requiredAny.length === 0) {
    throw new ApiError(403, "Admin access required");
  }

  return context;
}

export async function requireRole(
  allowed: RoleSlug[],
): Promise<AuthorizationContext> {
  const context = await resolveAuthorization();

  if (!context.hasAnyRole(allowed)) {
    throw new ApiError(403, "Insufficient privileges");
  }

  return context;
}

export async function requirePermission(
  permission: string | string[],
): Promise<AuthorizationContext> {
  const required = Array.isArray(permission) ? permission : [permission];
  const context = await resolveAuthorization();

  const hasPermission = required.every((perm) => context.hasPermission(perm));

  if (!hasPermission) {
    throw new ApiError(403, "Permission denied");
  }

  return context;
}
