import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { blockArraySchema, sanitizeCmsBlocks } from "@/lib/cms/blocks";
import { cmsPageSettingsSchema } from "@/lib/cms/pageSettings";
import { resolveAdminLocale } from "@/lib/public/adminLocale";

export async function GET(request: NextRequest) {
  await requirePermission("cms.read");
  const locale = resolveAdminLocale(request);
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from("cms_pages")
    .select("id, slug, title, status, updated_at, seo, settings, content")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (locale === "en") {
    return NextResponse.json({ pages: data ?? [] });
  }

  const translationsResult = await (supabaseAdmin as any)
    .from("cms_page_translations")
    .select("cms_page_id, title, seo, content, status, updated_at")
    .eq("locale", "ar");

  if (translationsResult.error) {
    return NextResponse.json(
      { error: translationsResult.error.message },
      { status: 500 },
    );
  }

  const translationsByPageId = new Map<string, any>(
    (translationsResult.data ?? []).map((row: any) => [row.cms_page_id, row]),
  );

  const pages = (data ?? []).map((page: any) => {
    const translation = translationsByPageId.get(page.id);
    return {
      ...page,
      title: translation?.title ?? page.title,
      seo: translation?.seo ?? page.seo,
      content: translation?.content ?? page.content,
      status: translation?.status ?? "draft",
      updated_at: translation?.updated_at ?? page.updated_at,
      locale,
    };
  });

  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  await requirePermission("cms.write");
  const locale = resolveAdminLocale(req);
  const body = await req.json();
  const {
    slug,
    title,
    content = [],
    seo = {},
    settings = {},
    status = "draft",
  } = body ?? {};

  if (!slug || (!title && locale === "en")) {
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

  let parsedSettings:
    | ReturnType<typeof cmsPageSettingsSchema.safeParse>
    | undefined = undefined;

  if (locale === "en") {
    parsedSettings = cmsPageSettingsSchema.safeParse(settings ?? {});
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

  // Use service-role for writes to avoid client-session RLS edge cases; access is already enforced above
  const supabaseAdmin = getSupabaseAdmin();
  if (locale === "ar") {
    const basePageResult = await (supabaseAdmin as any)
      .from("cms_pages")
      .select("id, slug, title, settings")
      .eq("slug", slug)
      .maybeSingle();

    if (basePageResult.error) {
      return NextResponse.json(
        { error: basePageResult.error.message },
        { status: 500 },
      );
    }

    if (!basePageResult.data) {
      return NextResponse.json(
        { error: "Create the English page before adding Arabic content" },
        { status: 400 },
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from("cms_page_translations")
      .upsert(
        {
          cms_page_id: basePageResult.data.id,
          locale: "ar",
          title: title ?? null,
          seo,
          content: parsedContent.data,
          status,
        },
        { onConflict: "cms_page_id,locale" },
      )
      .select("title, status, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        page: {
          id: basePageResult.data.id,
          slug: basePageResult.data.slug,
          title: data?.title ?? basePageResult.data.title,
          status: data?.status ?? status,
          updated_at: data?.updated_at ?? null,
        },
      },
      { status: 201 },
    );
  }

  const { data, error } = await (supabaseAdmin as any)
    .from("cms_pages")
    .insert({
      slug,
      title,
      content: parsedContent.data,
      seo,
      settings: parsedSettings?.success ? parsedSettings.data : {},
      status,
    })
    .select("id, slug, title, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ page: data }, { status: 201 });
}
