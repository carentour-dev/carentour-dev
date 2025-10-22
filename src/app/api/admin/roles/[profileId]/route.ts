import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { normalizeRoles } from "@/lib/auth/roles";

type RouteParams = {
  profileId: string;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: RouteParams },
) {
  const context = await requireRole(["admin"]);
  const supabaseAdmin = getSupabaseAdmin();
  const profileId = params?.profileId;

  if (!profileId) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const initialRequested = normalizeRoles(
    Array.isArray(body?.roles) ? body.roles : [],
  );
  const ensuredUser = initialRequested.includes("user")
    ? initialRequested
    : [...initialRequested, "user"];
  const requestedRoles = normalizeRoles(ensuredUser);

  // Fetch profile ownership information
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to load profile", details: profileError.message },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Prevent admins from removing their own admin access entirely
  if (
    profile.user_id === context.user.id &&
    !requestedRoles.includes("admin")
  ) {
    return NextResponse.json(
      { error: "You must retain your own admin role." },
      { status: 400 },
    );
  }

  // Resolve role ids for the requested slugs
  const { data: roleRecords, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id, slug")
    .in("slug", requestedRoles);

  if (rolesError) {
    return NextResponse.json(
      { error: "Failed to load roles", details: rolesError.message },
      { status: 500 },
    );
  }

  const roleMap = new Map<string, string>();
  for (const role of roleRecords ?? []) {
    if (role?.slug) {
      roleMap.set(role.slug, role.id);
    }
  }

  const missingRoles = requestedRoles.filter((role) => !roleMap.has(role));
  if (missingRoles.length) {
    return NextResponse.json(
      { error: "Unknown roles requested", details: missingRoles },
      { status: 400 },
    );
  }

  const roleIds = requestedRoles.map((role) => roleMap.get(role)!);

  // Reset current assignments, then insert the new set
  const { error: deleteError } = await supabaseAdmin
    .from("profile_roles")
    .delete()
    .eq("profile_id", profileId);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to reset roles", details: deleteError.message },
      { status: 500 },
    );
  }

  const insertPayload = roleIds.map((roleId) => ({
    profile_id: profileId,
    role_id: roleId,
    assigned_by: context.user.id,
  }));

  if (insertPayload.length) {
    const { error: insertError } = await supabaseAdmin
      .from("profile_roles")
      .insert(insertPayload, { returning: "minimal" });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to assign roles", details: insertError.message },
        { status: 500 },
      );
    }
  }

  const { data: updatedRoles, error: refreshError } = await supabaseAdmin.rpc(
    "user_roles",
    {
      p_user_id: profile.user_id,
    },
  );

  if (refreshError) {
    return NextResponse.json(
      {
        error: "Failed to finalize role assignments",
        details: refreshError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile_id: profileId,
    roles: updatedRoles ?? [],
  });
}
