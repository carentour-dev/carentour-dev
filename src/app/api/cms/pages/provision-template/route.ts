import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getTemplate } from "@/lib/cms/templates";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { resolveAdminLocale } from "@/lib/public/adminLocale";

export async function POST(request: NextRequest) {
  await requirePermission("cms.write");
  const locale = resolveAdminLocale(request);

  if (locale !== "en") {
    return NextResponse.json(
      { error: "Provision templates in English mode first." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const templateSlug =
    typeof body?.templateSlug === "string" ? body.templateSlug.trim() : "";
  const template = getTemplate(templateSlug);

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const existingResult = await (supabaseAdmin as any)
    .from("cms_pages")
    .select("id, slug, title, status, updated_at")
    .eq("slug", template.defaultSlug)
    .maybeSingle();

  if (existingResult.error) {
    return NextResponse.json(
      { error: existingResult.error.message },
      { status: 500 },
    );
  }

  if (existingResult.data) {
    return NextResponse.json({ page: existingResult.data, created: false });
  }

  const insertResult = await (supabaseAdmin as any)
    .from("cms_pages")
    .insert({
      slug: template.defaultSlug,
      title: template.defaultTitle,
      content: template.blocks,
      seo: template.seo ?? {},
      settings: {},
      status: "published",
    })
    .select("id, slug, title, status, updated_at")
    .single();

  if (insertResult.error) {
    return NextResponse.json(
      { error: insertResult.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ page: insertResult.data, created: true });
}
