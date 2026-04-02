import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

const toTagPath = (slug: string, locale: "en" | "ar" = "en") =>
  localizePublicPathname(`/blog/tag/${slug.replace(/^\/+/, "")}`, locale);

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const { data: tags, error } = await supabase
      .from("blog_tags")
      .select(
        `
        *,
        post_count:blog_post_tags(count)
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching tags:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 },
      );
    }

    // Transform post count
    const transformedTags =
      tags?.map((tag) => ({
        ...tag,
        post_count: tag.post_count?.[0]?.count || 0,
      })) || [];

    if (locale === "en") {
      return NextResponse.json({ tags: transformedTags });
    }

    const { data: translations, error: translationsError } = await (
      supabase as any
    )
      .from("blog_tag_translations")
      .select("blog_tag_id, name, slug, description, status, updated_at")
      .eq("locale", locale);

    if (translationsError) {
      console.error("Error fetching tag translations:", translationsError);
      return NextResponse.json(
        { error: "Failed to fetch tag translations" },
        { status: 500 },
      );
    }

    const translationByTagId = new Map<string, any>(
      (translations ?? []).map((row: any) => [row.blog_tag_id, row]),
    );

    return NextResponse.json({
      tags: transformedTags.map((tag) => {
        const translation = translationByTagId.get(tag.id);
        return {
          ...tag,
          name: translation?.name ?? tag.name,
          slug: translation?.slug ?? tag.slug,
          description: translation?.description ?? null,
          status: translation?.status ?? "draft",
          updated_at: translation?.updated_at ?? tag.created_at,
          base_slug: tag.slug,
          locale,
          has_translation: Boolean(translation),
        };
      }),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    if (locale === "ar") {
      return NextResponse.json(
        { error: "Create the English tag before adding Arabic content" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const { data: tag, error: insertError } = await supabase
      .from("blog_tags")
      .insert({ name, slug })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating tag:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create tag" },
        { status: 400 },
      );
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { id, name, slug } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    const { data: existingTag, error: existingTagError } = await supabase
      .from("blog_tags")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();

    if (existingTagError) {
      console.error("Error loading existing tag:", existingTagError);
      return NextResponse.json(
        { error: "Failed to load existing tag" },
        { status: 500 },
      );
    }

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    if (locale === "ar") {
      const { data: existingTranslation } = await (supabase as any)
        .from("blog_tag_translations")
        .select("slug, status")
        .eq("blog_tag_id", id)
        .eq("locale", "ar")
        .maybeSingle();

      const nextStatus =
        body.status ?? existingTranslation?.status ?? "published";
      const { data: translation, error: translationError } = await (
        supabase as any
      )
        .from("blog_tag_translations")
        .upsert(
          {
            blog_tag_id: id,
            locale: "ar",
            name,
            slug,
            description: body.description ?? null,
            status: nextStatus,
          },
          { onConflict: "blog_tag_id,locale" },
        )
        .select("name, slug, description, status, updated_at")
        .single();

      if (translationError) {
        console.error(
          "Error updating Arabic tag translation:",
          translationError,
        );
        return NextResponse.json(
          { error: translationError.message || "Failed to update Arabic tag" },
          { status: 400 },
        );
      }

      const oldSlug = existingTranslation?.slug;
      const newSlug = translation?.slug;
      if (oldSlug && newSlug && oldSlug !== newSlug) {
        const oldPath = toTagPath(oldSlug, "ar");
        const newPath = toTagPath(newSlug, "ar");
        try {
          await recordPathRedirect({
            fromPath: oldPath,
            toPath: newPath,
            source: "cms.blog.tags.translation.update",
            sourceMetadata: { tagId: id, locale: "ar" },
            createdBy: context.user.id,
          });
        } catch (redirectError) {
          console.error("Failed to record Arabic tag redirect", {
            tagId: id,
            oldPath,
            newPath,
            redirectError,
          });
        }
        revalidateSeoPaths([oldPath, newPath]);
      } else if (newSlug) {
        revalidateSeoPaths([toTagPath(newSlug, "ar")]);
      }

      return NextResponse.json({
        tag: {
          ...existingTag,
          name: translation?.name ?? existingTag.slug,
          slug: translation?.slug ?? existingTag.slug,
          description: translation?.description ?? null,
          status: translation?.status ?? nextStatus,
          updated_at: translation?.updated_at ?? null,
          base_slug: existingTag.slug,
          locale,
        },
      });
    }

    const { data: tag, error: updateError } = await supabase
      .from("blog_tags")
      .update({ name, slug })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating tag:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update tag" },
        { status: 400 },
      );
    }

    const oldSlug = existingTag.slug;
    const newSlug = tag.slug;
    if (oldSlug && newSlug) {
      const oldPath = toTagPath(oldSlug);
      const newPath = toTagPath(newSlug);

      if (oldPath !== newPath) {
        try {
          await recordPathRedirect({
            fromPath: oldPath,
            toPath: newPath,
            source: "cms.blog.tags.update",
            sourceMetadata: { tagId: id },
            createdBy: context.user.id,
          });
        } catch (redirectError) {
          console.error("Failed to record tag redirect", {
            tagId: id,
            oldPath,
            newPath,
            redirectError,
          });
        }
      }

      revalidateSeoPaths(["/blog", oldPath, newPath]);
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    if (locale === "ar") {
      const { error } = await (supabase as any)
        .from("blog_tag_translations")
        .delete()
        .eq("blog_tag_id", id)
        .eq("locale", "ar");

      if (error) {
        console.error("Error deleting Arabic tag translation:", error);
        return NextResponse.json(
          { error: "Failed to delete Arabic tag translation" },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("blog_tags").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tag:", error);
      return NextResponse.json(
        { error: "Failed to delete tag" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
