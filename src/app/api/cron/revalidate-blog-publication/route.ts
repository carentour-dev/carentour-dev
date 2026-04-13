import { NextRequest, NextResponse } from "next/server";
import type { PublicLocale } from "@/i18n/routing";
import {
  buildLocalizedBlogAuthorPath,
  buildLocalizedBlogCategoryPath,
  buildLocalizedBlogLandingPath,
  buildLocalizedBlogPostPath,
  buildLocalizedBlogTagPath,
} from "@/lib/blog/paths";
import { revalidateSeoPaths } from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type DueBlogPostRow = {
  id: string;
  slug: string;
  category_id: string | null;
  author_id: string | null;
  publish_date: string | null;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLookbackMinutes() {
  const rawValue = process.env.BLOG_PUBLISH_REVALIDATE_LOOKBACK_MINUTES;
  const parsed = rawValue ? Number(rawValue) : 10;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.min(parsed, 60);
}

function ensureCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function addLocalizedLandingPath(paths: Set<string>, locale: PublicLocale) {
  paths.add(buildLocalizedBlogLandingPath(locale));
}

export async function GET(request: NextRequest) {
  const authError = ensureCronAuthorized(request);
  if (authError) {
    return authError;
  }

  const supabase = getSupabaseAdmin() as any;
  const now = new Date();
  const nowIso = now.toISOString();
  const lookbackStart = new Date(
    now.getTime() - getLookbackMinutes() * 60 * 1000,
  ).toISOString();

  const { data: duePosts, error: duePostsError } = await supabase
    .from("blog_posts")
    .select("id, slug, category_id, author_id, publish_date")
    .eq("status", "published")
    .gte("publish_date", lookbackStart)
    .lte("publish_date", nowIso);

  if (duePostsError) {
    console.error("Failed to load due blog posts for revalidation", {
      lookbackStart,
      nowIso,
      duePostsError,
    });
    return NextResponse.json(
      { error: "Failed to load due blog posts" },
      { status: 500 },
    );
  }

  const posts = (duePosts ?? []) as DueBlogPostRow[];
  if (posts.length === 0) {
    return NextResponse.json({
      ok: true,
      duePostCount: 0,
      revalidatedPathCount: 0,
      lookbackStart,
      now: nowIso,
    });
  }

  const postIds = posts.map((post) => post.id);
  const categoryIds = Array.from(
    new Set(posts.map((post) => post.category_id).filter(Boolean)),
  ) as string[];
  const authorIds = Array.from(
    new Set(posts.map((post) => post.author_id).filter(Boolean)),
  ) as string[];

  const [
    categoriesRes,
    categoryTranslationsRes,
    authorsRes,
    authorTranslationsRes,
    postTranslationsRes,
    postTagsRes,
  ] = await Promise.all([
    categoryIds.length > 0
      ? supabase
          .from("blog_categories")
          .select("id, slug")
          .in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    categoryIds.length > 0
      ? supabase
          .from("blog_category_translations")
          .select("blog_category_id, slug, status")
          .eq("locale", "ar")
          .in("blog_category_id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    authorIds.length > 0
      ? supabase
          .from("blog_authors")
          .select("id, slug, active")
          .in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    authorIds.length > 0
      ? supabase
          .from("blog_author_translations")
          .select("blog_author_id, slug, status")
          .eq("locale", "ar")
          .in("blog_author_id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("blog_post_translations")
      .select("blog_post_id, slug, status")
      .eq("locale", "ar")
      .in("blog_post_id", postIds),
    supabase
      .from("blog_post_tags")
      .select("post_id, tag_id")
      .in("post_id", postIds),
  ]);

  const dependencyErrors = [
    categoriesRes.error,
    categoryTranslationsRes.error,
    authorsRes.error,
    authorTranslationsRes.error,
    postTranslationsRes.error,
    postTagsRes.error,
  ].filter(Boolean);

  if (dependencyErrors.length > 0) {
    console.error("Failed to load blog publication revalidation dependencies", {
      dependencyErrors,
      postIds,
    });
    return NextResponse.json(
      { error: "Failed to load blog revalidation dependencies" },
      { status: 500 },
    );
  }

  const tagIds = Array.from(
    new Set(((postTagsRes.data ?? []) as any[]).map((row) => row.tag_id)),
  ).filter(Boolean) as string[];

  const [tagsRes, tagTranslationsRes] = await Promise.all([
    tagIds.length > 0
      ? supabase.from("blog_tags").select("id, slug").in("id", tagIds)
      : Promise.resolve({ data: [], error: null }),
    tagIds.length > 0
      ? supabase
          .from("blog_tag_translations")
          .select("blog_tag_id, slug, status")
          .eq("locale", "ar")
          .in("blog_tag_id", tagIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tagsRes.error || tagTranslationsRes.error) {
    console.error("Failed to load blog tag revalidation dependencies", {
      tagsError: tagsRes.error,
      tagTranslationsError: tagTranslationsRes.error,
      tagIds,
    });
    return NextResponse.json(
      { error: "Failed to load blog tag dependencies" },
      { status: 500 },
    );
  }

  const categoryById = new Map<string, { slug: string }>(
    ((categoriesRes.data ?? []) as any[]).map((row) => [
      row.id,
      { slug: normalizeText(row.slug) },
    ]),
  );
  const arCategoryById = new Map<string, { slug: string; status: string }>(
    ((categoryTranslationsRes.data ?? []) as any[]).map((row) => [
      row.blog_category_id,
      {
        slug: normalizeText(row.slug),
        status: normalizeText(row.status),
      },
    ]),
  );
  const authorById = new Map<string, { slug: string; active: boolean }>(
    ((authorsRes.data ?? []) as any[]).map((row) => [
      row.id,
      {
        slug: normalizeText(row.slug),
        active: row.active !== false,
      },
    ]),
  );
  const arAuthorById = new Map<string, { slug: string; status: string }>(
    ((authorTranslationsRes.data ?? []) as any[]).map((row) => [
      row.blog_author_id,
      {
        slug: normalizeText(row.slug),
        status: normalizeText(row.status),
      },
    ]),
  );
  const arPostById = new Map<string, { slug: string; status: string }>(
    ((postTranslationsRes.data ?? []) as any[]).map((row) => [
      row.blog_post_id,
      {
        slug: normalizeText(row.slug),
        status: normalizeText(row.status),
      },
    ]),
  );
  const tagsById = new Map<string, { slug: string }>(
    ((tagsRes.data ?? []) as any[]).map((row) => [
      row.id,
      { slug: normalizeText(row.slug) },
    ]),
  );
  const arTagsById = new Map<string, { slug: string; status: string }>(
    ((tagTranslationsRes.data ?? []) as any[]).map((row) => [
      row.blog_tag_id,
      {
        slug: normalizeText(row.slug),
        status: normalizeText(row.status),
      },
    ]),
  );
  const tagIdsByPostId = new Map<string, string[]>();

  for (const row of (postTagsRes.data ?? []) as any[]) {
    const current = tagIdsByPostId.get(row.post_id) ?? [];
    current.push(row.tag_id);
    tagIdsByPostId.set(row.post_id, current);
  }

  const paths = new Set<string>();

  for (const post of posts) {
    addLocalizedLandingPath(paths, "en");

    const englishCategory = post.category_id
      ? categoryById.get(post.category_id)
      : null;
    const englishCategorySlug = normalizeText(englishCategory?.slug);
    const englishPostSlug = normalizeText(post.slug);

    if (englishCategorySlug) {
      paths.add(buildLocalizedBlogCategoryPath(englishCategorySlug, "en"));
      if (englishPostSlug) {
        paths.add(
          buildLocalizedBlogPostPath(
            englishCategorySlug,
            englishPostSlug,
            "en",
          ),
        );
      }
    }

    const englishAuthor = post.author_id
      ? authorById.get(post.author_id)
      : null;
    if (englishAuthor?.active && englishAuthor.slug) {
      paths.add(buildLocalizedBlogAuthorPath(englishAuthor.slug, "en"));
    }

    for (const tagId of tagIdsByPostId.get(post.id) ?? []) {
      const tag = tagsById.get(tagId);
      if (tag?.slug) {
        paths.add(buildLocalizedBlogTagPath(tag.slug, "en"));
      }
    }

    const arabicPost = arPostById.get(post.id);
    const arabicCategory = post.category_id
      ? arCategoryById.get(post.category_id)
      : null;

    if (
      arabicPost?.status === "published" &&
      arabicPost.slug &&
      arabicCategory?.status === "published" &&
      arabicCategory.slug
    ) {
      addLocalizedLandingPath(paths, "ar");
      paths.add(buildLocalizedBlogCategoryPath(arabicCategory.slug, "ar"));
      paths.add(
        buildLocalizedBlogPostPath(arabicCategory.slug, arabicPost.slug, "ar"),
      );

      const arabicAuthor = post.author_id
        ? arAuthorById.get(post.author_id)
        : null;
      if (
        englishAuthor?.active &&
        arabicAuthor?.status === "published" &&
        arabicAuthor.slug
      ) {
        paths.add(buildLocalizedBlogAuthorPath(arabicAuthor.slug, "ar"));
      }

      for (const tagId of tagIdsByPostId.get(post.id) ?? []) {
        const tag = arTagsById.get(tagId);
        if (tag?.status === "published" && tag.slug) {
          paths.add(buildLocalizedBlogTagPath(tag.slug, "ar"));
        }
      }
    }
  }

  revalidateSeoPaths(Array.from(paths));

  return NextResponse.json({
    ok: true,
    duePostCount: posts.length,
    revalidatedPathCount: paths.size,
    lookbackStart,
    now: nowIso,
    postIds,
  });
}
