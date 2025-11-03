import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { Database } from "@/integrations/supabase/types";

type NavigationLinkRow =
  Database["public"]["Tables"]["navigation_links"]["Row"];

const SELECT_COLUMNS =
  "id,label,slug,href,status,position,kind,cms_page_id,created_at,updated_at";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("nav.manage");

  const payload = (await request.json()) as Partial<NavigationLinkRow>;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("navigation_links")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Navigation link not found" },
      { status: 404 },
    );
  }

  const isAutoManaged = Boolean(existing.cms_page_id);
  const requestedStatus = payload.status;

  if (isAutoManaged && requestedStatus && requestedStatus !== existing.status) {
    const targetPageStatus =
      requestedStatus === "published" ? "published" : "draft";
    const { error: cmsError } = await supabase
      .from("cms_pages")
      .update({ status: targetPageStatus })
      .eq("id", existing.cms_page_id);

    if (cmsError) {
      return NextResponse.json({ error: cmsError.message }, { status: 500 });
    }
  }

  const updates = isAutoManaged
    ? {
        status: payload.status ?? existing.status,
        position: payload.position ?? existing.position,
      }
    : {
        label: payload.label ?? existing.label,
        href: payload.href ?? existing.href,
        slug: payload.slug ?? existing.slug,
        status: payload.status ?? existing.status,
        position: payload.position ?? existing.position,
        kind: payload.kind ?? existing.kind,
        cms_page_id: payload.cms_page_id ?? existing.cms_page_id,
      };

  const { data, error } = await supabase
    .from("navigation_links")
    .update(updates)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("nav.manage");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("navigation_links")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
