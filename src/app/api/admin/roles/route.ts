import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeRoles, pickPrimaryRole } from "@/lib/auth/roles";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const createRoleSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug cannot be empty.")
    .max(80, "Slug must be at most 80 characters.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(200, "Description must be at most 200 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  permissions: z.array(z.string().trim().min(1)).optional().default([]),
  is_superuser: z.boolean().optional().default(false),
});

const RESERVED_ROLE_SLUGS = new Set(["user", "admin"]);

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

export async function GET() {
  await requirePermission("admin.access");

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

export async function POST(req: NextRequest) {
  await requirePermission("admin.access");

  const supabaseAdmin = getSupabaseAdmin();

  const payload = await req.json().catch(() => null);

  const parsed = createRoleSchema.safeParse(payload);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Invalid role payload." },
      { status: 400 },
    );
  }

  const {
    name,
    slug: providedSlug,
    description,
    permissions,
    is_superuser,
  } = parsed.data;

  const finalSlug = slugify(providedSlug ?? name);

  if (!finalSlug) {
    return NextResponse.json(
      { error: "Provide a valid slug for the new role." },
      { status: 400 },
    );
  }

  if (RESERVED_ROLE_SLUGS.has(finalSlug)) {
    return NextResponse.json(
      { error: `"${finalSlug}" is reserved and cannot be used.` },
      { status: 400 },
    );
  }

  const descriptionValue =
    typeof description === "string" && description.trim().length
      ? description.trim()
      : null;

  const uniquePermissions = Array.from(
    new Set(
      (permissions ?? [])
        .map((perm) => perm.trim().toLowerCase())
        .filter((perm) => perm.length > 0),
    ),
  );

  const { data: insertedRole, error: insertError } = await supabaseAdmin
    .from("roles")
    .insert({
      slug: finalSlug,
      name: name.trim(),
      description: descriptionValue,
      is_superuser,
    })
    .select("id, slug, name, description, is_superuser, created_at, updated_at")
    .single();

  if (insertError || !insertedRole) {
    const message =
      insertError?.code === "23505"
        ? "A role with this slug already exists."
        : (insertError?.message ?? "Failed to create the role.");

    return NextResponse.json({ error: message }, { status: 400 });
  }

  let assignedPermissions: Array<{
    id: string;
    slug: string;
    name: string | null;
    description: string | null;
  }> = [];

  if (!is_superuser && uniquePermissions.length) {
    const { data: permissionRecords, error: permissionsError } =
      await supabaseAdmin
        .from("permissions")
        .select("id, slug, name, description")
        .in("slug", uniquePermissions);

    if (permissionsError) {
      await supabaseAdmin.from("roles").delete().eq("id", insertedRole.id);
      return NextResponse.json(
        {
          error: "Failed to look up permissions.",
          details: permissionsError.message,
        },
        { status: 500 },
      );
    }

    const foundSlugs = new Set(
      (permissionRecords ?? []).map((record) => record.slug),
    );
    const missing = uniquePermissions.filter((slug) => !foundSlugs.has(slug));

    if (missing.length) {
      await supabaseAdmin.from("roles").delete().eq("id", insertedRole.id);
      return NextResponse.json(
        {
          error: "Unknown permissions requested.",
          details: missing,
        },
        { status: 400 },
      );
    }

    const insertPayload = (permissionRecords ?? []).map((permission) => ({
      role_id: insertedRole.id,
      permission_id: permission.id,
    }));

    if (insertPayload.length) {
      const { error: insertPermissionsError } = await supabaseAdmin
        .from("role_permissions")
        .insert(insertPayload);

      if (insertPermissionsError) {
        await supabaseAdmin.from("roles").delete().eq("id", insertedRole.id);
        return NextResponse.json(
          {
            error: "Failed to assign role permissions.",
            details: insertPermissionsError.message,
          },
          { status: 500 },
        );
      }

      assignedPermissions = (permissionRecords ?? []).map((permission) => ({
        id: permission.id,
        slug: permission.slug,
        name: permission.name,
        description: permission.description,
      }));
    }
  }

  if (is_superuser) {
    const { data: allPermissions, error: permissionsError } =
      await supabaseAdmin
        .from("permissions")
        .select("id, slug, name, description")
        .order("slug", { ascending: true });

    if (permissionsError) {
      return NextResponse.json(
        {
          error: "Role created, but failed to load permissions.",
          details: permissionsError.message,
        },
        { status: 500 },
      );
    }

    assignedPermissions =
      (allPermissions ?? []).map((permission) => ({
        id: permission.id,
        slug: permission.slug,
        name: permission.name,
        description: permission.description,
      })) ?? [];
  }

  return NextResponse.json(
    {
      role: {
        ...insertedRole,
        description: insertedRole.description ?? null,
        permissions: assignedPermissions.sort((a, b) =>
          (a.slug ?? "").localeCompare(b.slug ?? ""),
        ),
      },
    },
    { status: 201 },
  );
}

export async function DELETE(req: NextRequest) {
  await requirePermission("admin.access");

  const supabaseAdmin = getSupabaseAdmin();
  const url = new URL(req.url);
  const roleId = url.searchParams.get("id");

  if (!roleId) {
    return NextResponse.json(
      { error: "Missing role id in request." },
      { status: 400 },
    );
  }

  const { data: roleRecord, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, slug, name, is_superuser")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    return NextResponse.json(
      {
        error: "Failed to load role.",
        details: roleError.message,
      },
      { status: 500 },
    );
  }

  if (!roleRecord) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  if (RESERVED_ROLE_SLUGS.has(roleRecord.slug)) {
    return NextResponse.json(
      { error: `The "${roleRecord.slug}" role cannot be deleted.` },
      { status: 400 },
    );
  }

  const { error: assignmentDeleteError } = await supabaseAdmin
    .from("profile_roles")
    .delete()
    .eq("role_id", roleRecord.id);

  if (assignmentDeleteError) {
    return NextResponse.json(
      {
        error: "Failed to remove role assignments.",
        details: assignmentDeleteError.message,
      },
      { status: 500 },
    );
  }

  const { error: rolePermissionsDeleteError } = await supabaseAdmin
    .from("role_permissions")
    .delete()
    .eq("role_id", roleRecord.id);

  if (rolePermissionsDeleteError) {
    return NextResponse.json(
      {
        error: "Failed to remove role permissions.",
        details: rolePermissionsDeleteError.message,
      },
      { status: 500 },
    );
  }

  const { error: roleDeleteError } = await supabaseAdmin
    .from("roles")
    .delete()
    .eq("id", roleRecord.id);

  if (roleDeleteError) {
    return NextResponse.json(
      {
        error: "Failed to delete role.",
        details: roleDeleteError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    deleted: true,
    role: {
      id: roleRecord.id,
      slug: roleRecord.slug,
      name: roleRecord.name,
    },
  });
}
