import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type RouteParams = {
  id: string;
};

const normalizePermissionSlugs = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const slug = entry.trim();
    if (!slug) {
      continue;
    }
    unique.add(slug);
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
};

export async function PUT(
  request: NextRequest,
  { params }: { params?: Promise<RouteParams> },
) {
  await requirePermission("admin.access");

  const routeParams = params ? await params : undefined;
  const roleId = routeParams?.id;
  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .select(
      `
        id,
        slug,
        name,
        description,
        is_superuser,
        created_at,
        updated_at
      `,
    )
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    return NextResponse.json(
      { error: "Failed to load role", details: roleError.message },
      { status: 500 },
    );
  }

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.is_superuser) {
    return NextResponse.json(
      { error: "Superuser roles automatically inherit every permission." },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => null);
  const requestedSlugs = normalizePermissionSlugs(payload?.permissions);

  let permissionRecords: Array<{ id: string; slug: string }> = [];

  if (requestedSlugs.length) {
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from("permissions")
      .select("id, slug")
      .in("slug", requestedSlugs);

    if (permissionsError) {
      return NextResponse.json(
        {
          error: "Failed to look up permissions",
          details: permissionsError.message,
        },
        { status: 500 },
      );
    }

    permissionRecords = permissions ?? [];

    const missing = requestedSlugs.filter(
      (slug) =>
        !permissionRecords.some((permission) => permission.slug === slug),
    );

    if (missing.length) {
      return NextResponse.json(
        { error: "Unknown permissions requested", details: missing },
        { status: 400 },
      );
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);

  if (deleteError) {
    return NextResponse.json(
      {
        error: "Failed to reset role permissions",
        details: deleteError.message,
      },
      { status: 500 },
    );
  }

  if (permissionRecords.length) {
    const insertPayload = permissionRecords.map((permission) => ({
      role_id: roleId,
      permission_id: permission.id,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("role_permissions")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to assign permissions", details: insertError.message },
        { status: 500 },
      );
    }
  }

  const { data: refreshedRole, error: refreshError } = await supabaseAdmin
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
    .eq("id", roleId)
    .maybeSingle();

  if (refreshError) {
    return NextResponse.json(
      { error: "Failed to load updated role", details: refreshError.message },
      { status: 500 },
    );
  }

  if (!refreshedRole) {
    return NextResponse.json(
      { error: "Role disappeared during update" },
      { status: 500 },
    );
  }

  const permissions = (refreshedRole.role_permissions ?? [])
    .map((entry: any) => entry?.permission)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.slug ?? "").localeCompare(b.slug ?? ""));

  return NextResponse.json({
    role: {
      id: refreshedRole.id,
      slug: refreshedRole.slug,
      name: refreshedRole.name,
      description: refreshedRole.description,
      is_superuser: refreshedRole.is_superuser,
      created_at: refreshedRole.created_at,
      updated_at: refreshedRole.updated_at,
      permissions,
    },
  });
}
