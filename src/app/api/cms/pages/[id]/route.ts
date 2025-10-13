import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema, sanitizeCmsBlocks } from "@/lib/cms/blocks";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireRole(["admin", "editor"]);
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .select("id, slug, title, seo, content, status, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ page: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireRole(["admin", "editor"]);
  const updates = await req.json();
  const sanitizedContent = sanitizeCmsBlocks(updates.content ?? []);
  const parsedContent = blockArraySchema.safeParse(sanitizedContent);
  if (!parsedContent.success) {
    const issue = parsedContent.error.issues[0];
    const fieldPath = issue?.path?.length
      ? issue.path.map(String).join(".")
      : undefined;
    const message = issue?.message ?? "Invalid block structure";
    return NextResponse.json(
      { error: fieldPath ? `${message} (field: ${fieldPath})` : message },
      { status: 400 },
    );
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
    .eq("id", id)
    .select("id, slug, title, seo, content, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ page: data });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireRole(["admin", "editor"]);
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
