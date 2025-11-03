import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema, sanitizeCmsBlocks } from "@/lib/cms/blocks";

export async function GET() {
  await requirePermission("cms.read");
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
  await requirePermission("cms.write");
  const body = await req.json();
  const { slug, title, content = [], seo = {}, status = "draft" } = body ?? {};

  if (!slug || !title) {
    return NextResponse.json(
      { error: "slug and title are required" },
      { status: 400 },
    );
  }

  const sanitizedContent = sanitizeCmsBlocks(content ?? []);
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
