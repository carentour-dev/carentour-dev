import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { sanitizeContentPayload } from "@/lib/blog/sanitize-content";
import { resolveAdminLocale } from "@/lib/public/adminLocale";

const BLOG_POST_TRANSLATION_COLUMNS =
  "blog_post_id, locale, slug, title, excerpt, content, seo_title, seo_description, seo_keywords, og_image, status, updated_at";
const EMPTY_TRANSLATED_CONTENT = { type: "richtext", data: "" } as const;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("blog_posts")
      .select(
        `
        *,
        category:blog_categories(id, name, slug, color),
        author:blog_authors(id, name, slug, avatar),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (locale === "en") {
      query = query.range(offset, offset + limit - 1);
    }

    if (status && status !== "all" && locale === "en") {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category_id", category);
    }

    if (search && locale === "en") {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Error fetching blog posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch blog posts" },
        { status: 500 },
      );
    }

    const transformedPosts =
      posts?.map((post) => ({
        ...post,
        tags: post.tags?.map((item: any) => item.tag).filter(Boolean) || [],
      })) || [];

    const postIds = transformedPosts.map((post) => post.id);
    const categoryIds = Array.from(
      new Set(
        transformedPosts
          .map((post) => post.category?.id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const authorIds = Array.from(
      new Set(
        transformedPosts
          .map((post) => post.author?.id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const tagIds = Array.from(
      new Set(
        transformedPosts.flatMap((post) =>
          (post.tags ?? [])
            .map((tag: any) => tag?.id)
            .filter((value: unknown): value is string => Boolean(value)),
        ),
      ),
    );

    const [
      postTranslationsRes,
      categoryTranslationsRes,
      authorTranslationsRes,
      tagTranslationsRes,
    ] = await Promise.all([
      postIds.length > 0
        ? (supabase as any)
            .from("blog_post_translations")
            .select(BLOG_POST_TRANSLATION_COLUMNS)
            .eq("locale", locale)
            .in("blog_post_id", postIds)
        : Promise.resolve({ data: [], error: null }),
      locale === "ar" && categoryIds.length > 0
        ? (supabase as any)
            .from("blog_category_translations")
            .select(
              "blog_category_id, name, slug, description, status, updated_at",
            )
            .eq("locale", "ar")
            .in("blog_category_id", categoryIds)
        : Promise.resolve({ data: [], error: null }),
      locale === "ar" && authorIds.length > 0
        ? (supabase as any)
            .from("blog_author_translations")
            .select("blog_author_id, name, slug, bio, status, updated_at")
            .eq("locale", "ar")
            .in("blog_author_id", authorIds)
        : Promise.resolve({ data: [], error: null }),
      locale === "ar" && tagIds.length > 0
        ? (supabase as any)
            .from("blog_tag_translations")
            .select("blog_tag_id, name, slug, description, status, updated_at")
            .eq("locale", "ar")
            .in("blog_tag_id", tagIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (postTranslationsRes.error) {
      console.error(
        "Error fetching blog post translations:",
        postTranslationsRes.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch blog post translations" },
        { status: 500 },
      );
    }

    if (categoryTranslationsRes.error) {
      console.error(
        "Error fetching category translations for blog posts:",
        categoryTranslationsRes.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch category translations" },
        { status: 500 },
      );
    }

    if (authorTranslationsRes.error) {
      console.error(
        "Error fetching author translations for blog posts:",
        authorTranslationsRes.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch author translations" },
        { status: 500 },
      );
    }

    if (tagTranslationsRes.error) {
      console.error(
        "Error fetching tag translations for blog posts:",
        tagTranslationsRes.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch tag translations" },
        { status: 500 },
      );
    }

    const postTranslationById = new Map<string, any>(
      ((postTranslationsRes.data ?? []) as any[]).map((row) => [
        row.blog_post_id,
        row,
      ]),
    );
    const categoryTranslationById = new Map<string, any>(
      ((categoryTranslationsRes.data ?? []) as any[]).map((row) => [
        row.blog_category_id,
        row,
      ]),
    );
    const authorTranslationById = new Map<string, any>(
      ((authorTranslationsRes.data ?? []) as any[]).map((row) => [
        row.blog_author_id,
        row,
      ]),
    );
    const tagTranslationById = new Map<string, any>(
      ((tagTranslationsRes.data ?? []) as any[]).map((row) => [
        row.blog_tag_id,
        row,
      ]),
    );

    let localizedPosts = transformedPosts.map((post) => {
      const translation = postTranslationById.get(post.id);
      const categoryTranslation = post.category?.id
        ? categoryTranslationById.get(post.category.id)
        : null;
      const authorTranslation = post.author?.id
        ? authorTranslationById.get(post.author.id)
        : null;

      return {
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
          locale === "ar"
            ? normalizeText(translation?.og_image)
            : post.og_image,
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
              bio: authorTranslation?.bio ?? null,
              status:
                locale === "ar"
                  ? authorTranslation?.status || "draft"
                  : "published",
            }
          : null,
        tags: (post.tags ?? []).map((tag: any) => {
          const tagTranslation = tagTranslationById.get(tag.id);
          return {
            ...tag,
            name: normalizeText(tagTranslation?.name) || tag.name,
            slug: normalizeText(tagTranslation?.slug) || tag.slug,
            description: tagTranslation?.description ?? null,
            status:
              locale === "ar" ? tagTranslation?.status || "draft" : "published",
          };
        }),
      };
    });

    if (locale === "ar") {
      if (status && status !== "all") {
        localizedPosts = localizedPosts.filter(
          (post) => post.status === status,
        );
      }

      if (search) {
        const needle = search.toLowerCase();
        localizedPosts = localizedPosts.filter((post) => {
          const haystack = [
            post.title,
            post.excerpt,
            post.category?.name,
            post.author?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        });
      }
    }

    const totalCount = locale === "ar" ? localizedPosts.length : count || 0;
    const paginatedPosts =
      locale === "ar"
        ? localizedPosts.slice(offset, offset + limit)
        : localizedPosts;

    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
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

export async function POST(request: NextRequest) {
  try {
    const context = await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    if (locale === "ar") {
      return NextResponse.json(
        { error: "Create the English post before adding Arabic content" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      author_id,
      status = "draft",
      publish_date,
      reading_time,
      seo_title,
      seo_description,
      seo_keywords,
      og_image,
      featured = false,
      tags = [],
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 },
      );
    }

    const sanitizedContent = sanitizeContentPayload(content);

    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt,
        content: sanitizedContent,
        featured_image,
        category_id,
        author_id,
        author_user_id: context.user.id,
        status,
        publish_date,
        reading_time,
        seo_title,
        seo_description,
        seo_keywords,
        og_image,
        featured,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating blog post:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create blog post" },
        { status: 400 },
      );
    }

    const { error: translationError } = await (supabase as any)
      .from("blog_post_translations")
      .upsert(
        {
          blog_post_id: post.id,
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
        "Error creating English blog post translation:",
        translationError,
      );
      return NextResponse.json(
        {
          error:
            translationError.message ||
            "Failed to initialize English blog post translation",
        },
        { status: 400 },
      );
    }

    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("blog_post_tags")
        .insert(tagInserts);

      if (tagsError) {
        console.error("Error adding tags:", tagsError);
      }
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
