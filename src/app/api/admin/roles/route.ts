import { NextResponse } from "next/server";

import { normalizeRoles, pickPrimaryRole } from "@/lib/auth/roles";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

export async function GET() {
  await requireRole(["admin"]);

  const supabaseAdmin = getSupabaseAdmin();

  const [rolesResult, permissionsResult, profilesResult] = await Promise.all([
    supabaseAdmin
      .from("roles")
      .select(
        `
          id,
          slug,
          name,
          description,
          is_superuser,
          created_at,
          updated_at,
          role_permissions:role_permissions(
            permission:permissions(
              id,
              slug,
              name,
              description
            )
          )
        `,
      )
      .order("slug", { ascending: true }),
    supabaseAdmin
      .from("permissions")
      .select("id, slug, name, description, created_at, updated_at")
      .order("slug", { ascending: true }),
    supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          user_id,
          username,
          avatar_url,
          email,
          created_at,
          updated_at,
          profile_roles:profile_roles(
            role:roles(
              slug,
              name,
              description,
              is_superuser
            )
          )
        `,
      )
      .order("created_at", { ascending: false }),
  ]);

  if (rolesResult.error) {
    return NextResponse.json(
      { error: "Failed to load roles", details: rolesResult.error.message },
      { status: 500 },
    );
  }

  if (permissionsResult.error) {
    return NextResponse.json(
      {
        error: "Failed to load permissions",
        details: permissionsResult.error.message,
      },
      { status: 500 },
    );
  }

  if (profilesResult.error) {
    return NextResponse.json(
      {
        error: "Failed to load profiles",
        details: profilesResult.error.message,
      },
      { status: 500 },
    );
  }

  const users = (profilesResult.data ?? []).map((profile) => {
    const rawRoles = (profile.profile_roles ?? [])
      .map((entry: any) => entry?.role?.slug)
      .filter(Boolean);
    const roles = normalizeRoles(rawRoles);
    const primary_role = pickPrimaryRole(roles);

    return {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      email: profile.email,
      primary_role,
      roles,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  });

  const allPermissions = (permissionsResult.data ?? []).map(
    (permission: any) => ({
      id: permission.id,
      slug: permission.slug,
      name: permission.name,
      description: permission.description,
    }),
  );

  const roles = (rolesResult.data ?? []).map((role: any) => {
    const assignedPermissions = (role.role_permissions ?? [])
      .map((entry: any) => entry?.permission)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.slug ?? "").localeCompare(b.slug ?? ""));

    const permissions = role.is_superuser
      ? [...allPermissions].sort((a, b) =>
          (a.slug ?? "").localeCompare(b.slug ?? ""),
        )
      : assignedPermissions;

    return {
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      is_superuser: role.is_superuser,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions,
    };
  });

  return NextResponse.json({ roles, permissions: allPermissions, users });
}
