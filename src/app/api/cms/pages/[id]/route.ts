import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema, sanitizeCmsBlocks } from "@/lib/cms/blocks";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";

const toCmsPath = (slug: string) =>
  slug === "home" ? "/" : `/${slug.replace(/^\/+/, "")}`;

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("cms.read");
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
  const context = await requirePermission("cms.write");
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
  const { data: existingPage, error: existingPageError } = await supabaseAdmin
    .from("cms_pages")
    .select("id, slug, status")
    .eq("id", id)
    .maybeSingle();

  if (existingPageError) {
    return NextResponse.json(
      { error: existingPageError.message },
      { status: 500 },
    );
  }

  if (!existingPage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const oldPath = toCmsPath(existingPage.slug);
  const newPath = toCmsPath(data.slug);

  if (oldPath !== newPath) {
    try {
      await recordPathRedirect({
        fromPath: oldPath,
        toPath: newPath,
        source: "cms.pages.update",
        sourceMetadata: {
          pageId: id,
          previousStatus: existingPage.status,
          nextStatus: data.status,
        },
        createdBy: context.user.id,
      });
    } catch (redirectError) {
      console.error("Failed to record CMS page redirect", {
        pageId: id,
        oldPath,
        newPath,
        redirectError,
      });
    }
  }

  revalidateSeoPaths([oldPath, newPath]);

  return NextResponse.json({ page: data });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("cms.write");
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingPage, error: existingError } = await supabaseAdmin
    .from("cms_pages")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existingPage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateSeoPaths([toCmsPath(existingPage.slug)]);

  return NextResponse.json({ ok: true });
}
