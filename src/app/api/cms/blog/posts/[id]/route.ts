import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { sanitizeContentPayload } from "@/lib/blog/sanitize-content";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

const BLOG_POST_TRANSLATION_COLUMNS =
  "blog_post_id, locale, slug, title, excerpt, content, seo_title, seo_description, seo_keywords, og_image, status, updated_at";
const EMPTY_TRANSLATED_CONTENT = { type: "richtext", data: "" } as const;

const toBlogPostPath = (
  categorySlug: string,
  postSlug: string,
  locale: "en" | "ar" = "en",
) =>
  localizePublicPathname(
    `/blog/${categorySlug.replace(/^\/+/, "")}/${postSlug.replace(/^\/+/, "")}`,
    locale,
  );

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("cms.read");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        category:blog_categories(id, name, slug, color),
        author:blog_authors(id, name, slug, avatar, bio, website, social_links, active),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching blog post:", error);
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    const [
      translationRes,
      categoryTranslationRes,
      authorTranslationRes,
      tagTranslationsRes,
    ] = await Promise.all([
      (supabase as any)
        .from("blog_post_translations")
        .select(BLOG_POST_TRANSLATION_COLUMNS)
        .eq("blog_post_id", id)
        .eq("locale", locale)
        .maybeSingle(),
      locale === "ar" && post.category?.id
        ? (supabase as any)
            .from("blog_category_translations")
            .select(
              "blog_category_id, name, slug, description, status, updated_at",
            )
            .eq("blog_category_id", post.category.id)
            .eq("locale", "ar")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      locale === "ar" && post.author?.id
        ? (supabase as any)
            .from("blog_author_translations")
            .select("blog_author_id, name, slug, bio, status, updated_at")
            .eq("blog_author_id", post.author.id)
            .eq("locale", "ar")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      locale === "ar" && Array.isArray(post.tags) && post.tags.length > 0
        ? (supabase as any)
            .from("blog_tag_translations")
            .select("blog_tag_id, name, slug, description, status, updated_at")
            .eq("locale", "ar")
            .in(
              "blog_tag_id",
              post.tags
                .map((item: any) => item?.tag?.id)
                .filter((value: unknown): value is string => Boolean(value)),
            )
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (translationRes.error) {
      console.error(
        "Error fetching blog post translation:",
        translationRes.error,
      );
      return NextResponse.json(
        { error: "Failed to load blog post translation" },
        { status: 500 },
      );
    }

    if (categoryTranslationRes.error) {
      console.error(
        "Error fetching blog category translation for post:",
        categoryTranslationRes.error,
      );
      return NextResponse.json(
        { error: "Failed to load blog category translation" },
        { status: 500 },
      );
    }

    if (authorTranslationRes.error) {
      console.error(
        "Error fetching blog author translation for post:",
        authorTranslationRes.error,
      );
      return NextResponse.json(
        { error: "Failed to load blog author translation" },
        { status: 500 },
      );
    }

    if (tagTranslationsRes.error) {
      console.error(
        "Error fetching blog tag translations for post:",
        tagTranslationsRes.error,
      );
      return NextResponse.json(
        { error: "Failed to load blog tag translations" },
        { status: 500 },
      );
    }

    const translation = translationRes.data;
    const categoryTranslation = categoryTranslationRes.data;
    const authorTranslation = authorTranslationRes.data;
    const tagTranslationById = new Map<string, any>(
      ((tagTranslationsRes.data ?? []) as any[]).map((row) => [
        row.blog_tag_id,
        row,
      ]),
    );

    const transformedPost = {
      ...post,
      title: locale === "ar" ? normalizeText(translation?.title) : post.title,
      slug: locale === "ar" ? normalizeText(translation?.slug) : post.slug,
      excerpt:
        locale === "ar" ? normalizeText(translation?.excerpt) : post.excerpt,
      content:
        locale === "ar"
          ? (translation?.content ?? EMPTY_TRANSLATED_CONTENT)
          : post.content,
      seo_title:
        locale === "ar"
          ? normalizeText(translation?.seo_title)
          : post.seo_title,
      seo_description:
        locale === "ar"
          ? normalizeText(translation?.seo_description)
          : post.seo_description,
      seo_keywords:
        locale === "ar"
          ? normalizeText(translation?.seo_keywords)
          : post.seo_keywords,
      og_image:
        locale === "ar" ? normalizeText(translation?.og_image) : post.og_image,
      status: locale === "ar" ? translation?.status || "draft" : post.status,
      updated_at: translation?.updated_at || post.updated_at,
      base_slug: post.slug,
      base_title: post.title,
      locale,
      has_translation: Boolean(translation),
      category: post.category
        ? {
            ...post.category,
            name:
              normalizeText(categoryTranslation?.name) || post.category.name,
            slug:
              normalizeText(categoryTranslation?.slug) || post.category.slug,
            description: categoryTranslation?.description ?? null,
            status:
              locale === "ar"
                ? categoryTranslation?.status || "draft"
                : "published",
          }
        : null,
      author: post.author
        ? {
            ...post.author,
            name: normalizeText(authorTranslation?.name) || post.author.name,
            slug: normalizeText(authorTranslation?.slug) || post.author.slug,
            bio: authorTranslation?.bio ?? post.author.bio,
            status:
              locale === "ar"
                ? authorTranslation?.status || "draft"
                : "published",
          }
        : null,
      tags:
        post.tags?.map((item: any) => {
          const tag = item.tag;
          const tagTranslation = tagTranslationById.get(tag?.id);
          return {
            ...tag,
            name: normalizeText(tagTranslation?.name) || tag?.name,
            slug: normalizeText(tagTranslation?.slug) || tag?.slug,
            description: tagTranslation?.description ?? null,
            status:
              locale === "ar" ? tagTranslation?.status || "draft" : "published",
          };
        }) || [],
    };

    return NextResponse.json({ post: transformedPost });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      author_id,
      status,
      publish_date,
      reading_time,
      seo_title,
      seo_description,
      seo_keywords,
      og_image,
      featured,
      tags,
    } = body;

    const sanitizedContent = sanitizeContentPayload(content);

    const { data: existingPost, error: existingPostError } = await supabase
      .from("blog_posts")
      .select("id, slug, category_id, category:blog_categories(slug)")
      .eq("id", id)
      .maybeSingle();

    if (existingPostError) {
      console.error("Error loading existing blog post:", existingPostError);
      return NextResponse.json(
        { error: "Failed to load existing blog post" },
        { status: 500 },
      );
    }

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    if (locale === "ar") {
      const [existingTranslationRes, categoryTranslationRes] =
        await Promise.all([
          (supabase as any)
            .from("blog_post_translations")
            .select("slug, status")
            .eq("blog_post_id", id)
            .eq("locale", "ar")
            .maybeSingle(),
          existingPost.category_id
            ? (supabase as any)
                .from("blog_category_translations")
                .select("slug")
                .eq("blog_category_id", existingPost.category_id)
                .eq("locale", "ar")
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      if (existingTranslationRes.error) {
        console.error(
          "Error loading existing Arabic blog post translation:",
          existingTranslationRes.error,
        );
        return NextResponse.json(
          { error: "Failed to load existing Arabic blog post translation" },
          { status: 500 },
        );
      }

      if (categoryTranslationRes.error) {
        console.error(
          "Error loading Arabic category translation for blog post:",
          categoryTranslationRes.error,
        );
        return NextResponse.json(
          { error: "Failed to load Arabic category translation" },
          { status: 500 },
        );
      }

      const existingTranslation = existingTranslationRes.data;
      const localizedCategorySlug =
        normalizeText(categoryTranslationRes.data?.slug) ||
        (existingPost as any)?.category?.slug;
      const nextStatus = status ?? existingTranslation?.status ?? "draft";

      if (
        nextStatus === "published" &&
        (!normalizeText(title) || !normalizeText(slug))
      ) {
        return NextResponse.json(
          {
            error:
              "Arabic title and slug are required before publishing this translation",
          },
          { status: 400 },
        );
      }

      const { data: translation, error: translationError } = await (
        supabase as any
      )
        .from("blog_post_translations")
        .upsert(
          {
            blog_post_id: id,
            locale: "ar",
            slug,
            title,
            excerpt,
            content: sanitizedContent,
            seo_title,
            seo_description,
            seo_keywords,
            og_image,
            status: nextStatus,
          },
          { onConflict: "blog_post_id,locale" },
        )
        .select(BLOG_POST_TRANSLATION_COLUMNS)
        .single();

      if (translationError) {
        console.error(
          "Error updating Arabic blog post translation:",
          translationError,
        );
        return NextResponse.json(
          {
            error:
              translationError.message ||
              "Failed to update Arabic blog post translation",
          },
          { status: 400 },
        );
      }

      const oldSlug = existingTranslation?.slug;
      const newSlug = translation?.slug;
      if (localizedCategorySlug && oldSlug && newSlug) {
        const oldPath = toBlogPostPath(localizedCategorySlug, oldSlug, "ar");
        const newPath = toBlogPostPath(localizedCategorySlug, newSlug, "ar");

        if (oldPath !== newPath) {
          try {
            await recordPathRedirect({
              fromPath: oldPath,
              toPath: newPath,
              source: "cms.blog.posts.translation.update",
              sourceMetadata: { postId: id, locale: "ar" },
              createdBy: context.user.id,
            });
          } catch (redirectError) {
            console.error("Failed to record Arabic blog post redirect", {
              postId: id,
              oldPath,
              newPath,
              redirectError,
            });
          }
          revalidateSeoPaths([
            localizePublicPathname("/blog", "ar"),
            oldPath,
            newPath,
          ]);
        } else {
          revalidateSeoPaths([newPath]);
        }
      }

      return NextResponse.json({
        post: {
          ...existingPost,
          title: translation?.title ?? title,
          slug: translation?.slug ?? slug,
          excerpt: translation?.excerpt ?? excerpt,
          content: translation?.content ?? sanitizedContent,
          seo_title: translation?.seo_title ?? seo_title,
          seo_description: translation?.seo_description ?? seo_description,
          seo_keywords: translation?.seo_keywords ?? seo_keywords,
          og_image: translation?.og_image ?? og_image,
          status: translation?.status ?? nextStatus,
          updated_at: translation?.updated_at ?? null,
          locale,
          has_translation: true,
          base_slug: existingPost.slug,
        },
      });
    }

    const { data: post, error: updateError } = await supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt,
        content: sanitizedContent,
        featured_image,
        category_id,
        author_id,
        status,
        publish_date,
        reading_time,
        seo_title,
        seo_description,
        seo_keywords,
        og_image,
        featured,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating blog post:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update blog post" },
        { status: 400 },
      );
    }

    const { error: translationError } = await (supabase as any)
      .from("blog_post_translations")
      .upsert(
        {
          blog_post_id: id,
          locale: "en",
          slug,
          title,
          excerpt,
          content: sanitizedContent,
          seo_title,
          seo_description,
          seo_keywords,
          og_image,
          status,
        },
        { onConflict: "blog_post_id,locale" },
      );

    if (translationError) {
      console.error(
        "Error updating English blog post translation:",
        translationError,
      );
      return NextResponse.json(
        {
          error:
            translationError.message ||
            "Failed to update English blog post translation",
        },
        { status: 400 },
      );
    }

    if (tags !== undefined) {
      await supabase.from("blog_post_tags").delete().eq("post_id", id);

      if (tags.length > 0) {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from("blog_post_tags")
          .insert(tagInserts);

        if (tagsError) {
          console.error("Error updating tags:", tagsError);
        }
      }
    }

    const { data: updatedPostPath, error: updatedPostPathError } =
      await supabase
        .from("blog_posts")
        .select("slug, category:blog_categories(slug)")
        .eq("id", id)
        .maybeSingle();

    if (!updatedPostPathError && updatedPostPath) {
      const oldCategorySlug = (existingPost as any)?.category?.slug;
      const newCategorySlug = (updatedPostPath as any)?.category?.slug;
      const oldPostSlug = existingPost.slug;
      const newPostSlug = updatedPostPath.slug;

      if (oldCategorySlug && newCategorySlug && oldPostSlug && newPostSlug) {
        const oldPath = toBlogPostPath(oldCategorySlug, oldPostSlug);
        const newPath = toBlogPostPath(newCategorySlug, newPostSlug);

        if (oldPath !== newPath) {
          try {
            await recordPathRedirect({
              fromPath: oldPath,
              toPath: newPath,
              source: "cms.blog.posts.update",
              sourceMetadata: { postId: id },
              createdBy: context.user.id,
            });
          } catch (redirectError) {
            console.error("Failed to record blog post redirect", {
              postId: id,
              oldPath,
              newPath,
              redirectError,
            });
          }
        }

        revalidateSeoPaths([
          "/blog",
          `/blog/${oldCategorySlug}`,
          `/blog/${newCategorySlug}`,
          oldPath,
          newPath,
        ]);
      }
    }

    return NextResponse.json({
      post: {
        ...post,
        locale,
        has_translation: true,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    if (locale === "ar") {
      const { error } = await (supabase as any)
        .from("blog_post_translations")
        .delete()
        .eq("blog_post_id", id)
        .eq("locale", "ar");

      if (error) {
        console.error("Error deleting Arabic blog post translation:", error);
        return NextResponse.json(
          { error: "Failed to delete Arabic blog post translation" },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting blog post:", error);
      return NextResponse.json(
        { error: "Failed to delete blog post" },
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
