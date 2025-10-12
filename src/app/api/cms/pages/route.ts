import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema } from "@/lib/cms/blocks";

export async function GET() {
  await requireRole(["admin", "editor"]);
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .select("id, slug, title, status, updated_at, seo, content")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(req: NextRequest) {
  await requireRole(["admin", "editor"]);
  const body = await req.json();
  const { slug, title, content = [], seo = {}, status = "draft" } = body ?? {};

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  const parsedContent = blockArraySchema.safeParse(content ?? []);
  if (!parsedContent.success) {
    return NextResponse.json({ error: "Invalid block structure" }, { status: 400 });
  }

  // Use service-role for writes to avoid client-session RLS edge cases; access is already enforced above
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .insert({ slug, title, content: parsedContent.data, seo, status })
    .select("id, slug, title, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ page: data }, { status: 201 });
}
