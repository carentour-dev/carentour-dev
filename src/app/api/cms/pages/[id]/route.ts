import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema } from "@/lib/cms/blocks";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  await requireRole(["admin", "editor"]);
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .select("id, slug, title, seo, content, status, updated_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ page: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  await requireRole(["admin", "editor"]);
  const updates = await req.json();
  const parsedContent = blockArraySchema.safeParse(updates.content ?? []);
  if (!parsedContent.success) {
    return NextResponse.json({ error: "Invalid block structure" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .update({
      slug: updates.slug,
      title: updates.title,
      seo: updates.seo,
      content: parsedContent.data,
      status: updates.status,
    })
    .eq("id", params.id)
    .select("id, slug, title, seo, content, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ page: data });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await requireRole(["admin", "editor"]);
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

