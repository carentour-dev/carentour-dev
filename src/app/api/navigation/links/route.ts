import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { requirePermission } from "@/server/auth/requireAdmin";
import { Database } from "@/integrations/supabase/types";

type NavigationLinkRow =
  Database["public"]["Tables"]["navigation_links"]["Row"];

const SELECT_COLUMNS =
  "id,label,slug,href,status,position,kind,cms_page_id,created_at,updated_at";

export async function GET() {
  await requirePermission("nav.manage");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("navigation_links")
    .select(SELECT_COLUMNS)
    .order("position", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  await requirePermission("nav.manage");
  const payload = (await request.json()) as Partial<NavigationLinkRow>;

  if (!payload?.label || !payload?.href || !payload?.slug) {
    return NextResponse.json(
      { error: "label, href, and slug are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("navigation_links")
    .insert({
      label: payload.label,
      href: payload.href,
      slug: payload.slug,
      status: payload.status ?? "published",
      position: payload.position ?? 999,
      kind: payload.kind ?? (payload.cms_page_id ? "cms" : "manual"),
      cms_page_id: payload.cms_page_id ?? null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
