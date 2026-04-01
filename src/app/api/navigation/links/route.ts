import { NextRequest, NextResponse } from "next/server";

import { filterOrphanedNavigationRows } from "@/lib/navigation";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { requirePermission } from "@/server/auth/requireAdmin";
import { Database } from "@/integrations/supabase/types";

type NavigationLinkRow =
  Database["public"]["Tables"]["navigation_links"]["Row"];

const SELECT_COLUMNS =
  "id,label,slug,href,status,position,kind,cms_page_id,created_at,updated_at";

export async function GET(request: NextRequest) {
  await requirePermission("nav.manage");
  const locale = resolveAdminLocale(request);
  const supabase = getSupabaseAdmin();

  const [{ data, error }, { data: cmsPages, error: cmsPagesError }] =
    await Promise.all([
      supabase
        .from("navigation_links")
        .select(SELECT_COLUMNS)
        .order("position", { ascending: true })
        .order("label", { ascending: true }),
      supabase.from("cms_pages").select("id, slug"),
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (cmsPagesError) {
    return NextResponse.json({ error: cmsPagesError.message }, { status: 500 });
  }

  if (locale === "ar") {
    const translationsResult = await (supabase as any)
      .from("navigation_link_translations")
      .select("navigation_link_id, label, status, updated_at")
      .eq("locale", "ar");

    if (translationsResult.error) {
      return NextResponse.json(
        { error: translationsResult.error.message },
        { status: 500 },
      );
    }

    const translationsByLinkId = new Map<string, any>(
      (translationsResult.data ?? []).map((row: any) => [
        row.navigation_link_id,
        row,
      ]),
    );

    return NextResponse.json({
      data: filterOrphanedNavigationRows(data ?? [], cmsPages ?? []).map(
        (row) => {
          const translation = translationsByLinkId.get(row.id);
          return {
            ...row,
            label: translation?.label ?? row.label,
            status: translation?.status ?? "draft",
            updated_at: translation?.updated_at ?? row.updated_at,
            locale,
          };
        },
      ),
    });
  }

  return NextResponse.json({
    data: filterOrphanedNavigationRows(data ?? [], cmsPages ?? []),
  });
}

export async function POST(request: NextRequest) {
  await requirePermission("nav.manage");
  const locale = resolveAdminLocale(request);
  const payload = (await request.json()) as Partial<NavigationLinkRow>;

  if (locale === "ar") {
    return NextResponse.json(
      {
        error:
          "Create the base English navigation link before adding Arabic content",
      },
      { status: 400 },
    );
  }

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
