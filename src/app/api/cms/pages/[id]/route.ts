import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema, sanitizeCmsBlocks } from "@/lib/cms/blocks";
import { cmsPageSettingsSchema } from "@/lib/cms/pageSettings";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

const toCmsPath = (slug: string) =>
  slug === "home" ? "/" : `/${slug.replace(/^\/+/, "")}`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("cms.read");
  const locale = resolveAdminLocale(request);
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from("cms_pages")
    .select("id, slug, title, seo, settings, content, status, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (locale === "en") {
    return NextResponse.json({ page: data });
  }

  const translationResult = await (supabaseAdmin as any)
    .from("cms_page_translations")
    .select("title, seo, content, status, updated_at")
    .eq("cms_page_id", id)
    .eq("locale", "ar")
    .maybeSingle();

  if (translationResult.error) {
    return NextResponse.json(
      { error: translationResult.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    page: {
      ...data,
      title: translationResult.data?.title ?? data.title,
      seo: translationResult.data?.seo ?? {},
      content: translationResult.data?.content ?? [],
      status: translationResult.data?.status ?? "draft",
      updated_at: translationResult.data?.updated_at ?? data.updated_at,
      locale,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await requirePermission("cms.write");
  const locale = resolveAdminLocale(req);
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

  let parsedSettings:
    | ReturnType<typeof cmsPageSettingsSchema.safeParse>
    | undefined = undefined;

  if (locale === "en") {
    parsedSettings = cmsPageSettingsSchema.safeParse(updates.settings ?? {});
    if (!parsedSettings.success) {
      const issue = parsedSettings.error.issues[0];
      const fieldPath = issue?.path?.length
        ? issue.path.map(String).join(".")
        : undefined;
      const message = issue?.message ?? "Invalid page settings";
      return NextResponse.json(
        { error: fieldPath ? `${message} (field: ${fieldPath})` : message },
        { status: 400 },
      );
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existingPage, error: existingPageError } = await (
    supabaseAdmin as any
  )
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

  if (locale === "ar") {
    const { data, error } = await (supabaseAdmin as any)
      .from("cms_page_translations")
      .upsert(
        {
          cms_page_id: id,
          locale: "ar",
          title: updates.title ?? null,
          seo: updates.seo ?? {},
          content: parsedContent.data,
          status: updates.status ?? "draft",
        },
        { onConflict: "cms_page_id,locale" },
      )
      .select("title, seo, content, status, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateSeoPaths([
      toCmsPath(existingPage.slug),
      localizePublicPathname(toCmsPath(existingPage.slug), "ar"),
    ]);

    return NextResponse.json({
      page: {
        id: existingPage.id,
        slug: existingPage.slug,
        title: data?.title ?? existingPage.slug,
        seo: data?.seo ?? {},
        settings: updates.settings ?? {},
        content: data?.content ?? [],
        status: data?.status ?? "draft",
        updated_at: data?.updated_at ?? null,
      },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("cms_pages")
    .update({
      slug: updates.slug,
      title: updates.title,
      seo: updates.seo,
      settings: parsedSettings?.success ? parsedSettings.data : {},
      content: parsedContent.data,
      status: updates.status,
    })
    .eq("id", id)
    .select("id, slug, title, seo, settings, content, status, updated_at")
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("cms.write");
  const locale = resolveAdminLocale(request);
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingPage, error: existingError } = await (
    supabaseAdmin as any
  )
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

  if (locale === "ar") {
    const { error } = await (supabaseAdmin as any)
      .from("cms_page_translations")
      .delete()
      .eq("cms_page_id", id)
      .eq("locale", "ar");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateSeoPaths([
      localizePublicPathname(toCmsPath(existingPage.slug), "ar"),
    ]);
    return NextResponse.json({ ok: true });
  }

  const { error: navigationDeleteError } = await supabaseAdmin
    .from("navigation_links")
    .delete()
    .eq("kind", "cms")
    .or(`cms_page_id.eq.${id},slug.eq.${existingPage.slug}`);

  if (navigationDeleteError) {
    return NextResponse.json(
      { error: navigationDeleteError.message },
      { status: 500 },
    );
  }

  const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateSeoPaths([toCmsPath(existingPage.slug)]);

  return NextResponse.json({ ok: true });
}
