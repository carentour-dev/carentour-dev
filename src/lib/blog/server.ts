import type { PublicLocale } from "@/i18n/routing";
import { stripPublicLocalePrefix } from "@/lib/public/routing";
import {
  buildLocalizedBlogAuthorPath,
  buildLocalizedBlogCategoryPath,
  buildLocalizedBlogLandingPath,
  buildLocalizedBlogPostPath,
  buildLocalizedBlogTagPath,
} from "@/lib/blog/paths";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type BlogCategoryBaseRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order: number | null;
  updated_at: string | null;
};

type BlogTagBaseRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
};

type BlogAuthorBaseRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  website: string | null;
  social_links: Record<string, unknown> | null;
  active: boolean | null;
  updated_at: string | null;
};

type BlogPostBaseRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  featured_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: string;
  publish_date: string | null;
  reading_time: number | null;
  view_count: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  featured: boolean | null;
  updated_at: string | null;
};

type BlogCategoryTranslationRow = {
  blog_category_id: string;
  locale: PublicLocale;
  name: string | null;
  slug: string | null;
  description: string | null;
  status: string;
  updated_at: string | null;
};

type BlogTagTranslationRow = {
  blog_tag_id: string;
  locale: PublicLocale;
  name: string | null;
  slug: string | null;
  description: string | null;
  status: string;
  updated_at: string | null;
};

type BlogAuthorTranslationRow = {
  blog_author_id: string;
  locale: PublicLocale;
  name: string | null;
  slug: string | null;
  bio: string | null;
  status: string;
  updated_at: string | null;
};

type BlogPostTranslationRow = {
  blog_post_id: string;
  locale: PublicLocale;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  content: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  status: string;
  updated_at: string | null;
};

const EMPTY_TRANSLATED_POST_CONTENT = { type: "richtext", data: "" } as const;

type BlogCategoryEntry = {
  base: BlogCategoryBaseRow;
  translation: BlogCategoryTranslationRow | null;
};

type BlogTagEntry = {
  base: BlogTagBaseRow;
  translation: BlogTagTranslationRow | null;
};

type BlogAuthorEntry = {
  base: BlogAuthorBaseRow;
  translation: BlogAuthorTranslationRow | null;
};

type BlogPostEntry = {
  base: BlogPostBaseRow;
  translation: BlogPostTranslationRow | null;
};

type CmsPageLike = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updated_at: string | null;
};

export type LocalizedBlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order: number | null;
  status: "draft" | "published";
  updated_at: string | null;
  locale: PublicLocale;
  base_slug: string;
  path: string;
};

export type LocalizedBlogTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published";
  updated_at: string | null;
  locale: PublicLocale;
  base_slug: string;
  path: string;
};

export type LocalizedBlogAuthor = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  website: string | null;
  social_links: Record<string, unknown> | null;
  active: boolean;
  status: "draft" | "published";
  updated_at: string | null;
  locale: PublicLocale;
  base_slug: string;
  path: string;
};

export type LocalizedBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  featured_image: string | null;
  publish_date: string | null;
  reading_time: number | null;
  view_count: number | null;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  status: "draft" | "published" | "scheduled";
  updated_at: string | null;
  locale: PublicLocale;
  base_slug: string;
  path: string | null;
  category: LocalizedBlogCategory | null;
  author: LocalizedBlogAuthor | null;
  tags: LocalizedBlogTag[];
};

export type BlogPostListResult = {
  posts: LocalizedBlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type BlogBlockContextEntity =
  | {
      type: "landing";
      pagePath: string;
    }
  | {
      type: "category";
      pagePath: string;
      category: LocalizedBlogCategory;
    }
  | {
      type: "tag";
      pagePath: string;
      tag: LocalizedBlogTag;
    }
  | {
      type: "author";
      pagePath: string;
      author: LocalizedBlogAuthor;
    }
  | {
      type: "post";
      pagePath: string;
      post: LocalizedBlogPost;
    };

const BLOG_CATEGORY_TRANSLATION_COLUMNS =
  "blog_category_id, locale, name, slug, description, status, updated_at";
const BLOG_TAG_TRANSLATION_COLUMNS =
  "blog_tag_id, locale, name, slug, description, status, updated_at";
const BLOG_AUTHOR_TRANSLATION_COLUMNS =
  "blog_author_id, locale, name, slug, bio, status, updated_at";
const BLOG_POST_TRANSLATION_COLUMNS =
  "blog_post_id, locale, slug, title, excerpt, content, seo_title, seo_description, seo_keywords, og_image, status, updated_at";

export const BLOG_CATEGORY_TEMPLATE_SLUG = "blog-category-template";
export const BLOG_TAG_TEMPLATE_SLUG = "blog-tag-template";
export const BLOG_AUTHOR_TEMPLATE_SLUG = "blog-author-template";
export const BLOG_POST_TEMPLATE_SLUG = "blog-post-template";
export const BLOG_INTERNAL_TEMPLATE_SLUGS = new Set([
  BLOG_CATEGORY_TEMPLATE_SLUG,
  BLOG_TAG_TEMPLATE_SLUG,
  BLOG_AUTHOR_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_SLUG,
]);

function asSupabase() {
  return getSupabaseAdmin() as any;
}

function cleanText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asPublishedStatus(value: string | null | undefined) {
  return value === "published";
}

function isPublicPostStatus(value: string | null | undefined) {
  return value === "published" || value === "scheduled" || value === "draft";
}

function isLocalePublished(
  locale: PublicLocale,
  status: string | null | undefined,
  publishedOnly: boolean,
) {
  if (locale === "en") {
    return !publishedOnly || asPublishedStatus(status);
  }

  return !publishedOnly || asPublishedStatus(status);
}

function stripLocalePrefix(pathname: string) {
  return stripPublicLocalePrefix(pathname);
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function nowIso() {
  return new Date().toISOString();
}

async function getLocalizedCmsPageRecordBySlug(
  slug: string,
  locale: PublicLocale,
) {
  const supabase = asSupabase();
  const { data: basePage, error: baseError } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (baseError || !basePage) {
    return null;
  }

  if (locale === "en") {
    return basePage as CmsPageLike;
  }

  const { data: translation, error: translationError } = await supabase
    .from("cms_page_translations")
    .select("title, status, updated_at")
    .eq("cms_page_id", basePage.id)
    .eq("locale", locale)
    .eq("status", "published")
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  return {
    id: basePage.id,
    slug: basePage.slug,
    title: cleanText(translation.title) ?? basePage.title,
    status: translation.status,
    updated_at: translation.updated_at ?? basePage.updated_at,
  } satisfies CmsPageLike;
}

async function fetchCategoryTranslationByCategoryId(
  categoryId: string,
  locale: PublicLocale,
) {
  if (locale === "en") {
    return null;
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_category_translations")
    .select(BLOG_CATEGORY_TRANSLATION_COLUMNS)
    .eq("blog_category_id", categoryId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog category translation", {
      categoryId,
      locale,
      error,
    });
    return null;
  }

  return (data ?? null) as BlogCategoryTranslationRow | null;
}

async function fetchTagTranslationByTagId(tagId: string, locale: PublicLocale) {
  if (locale === "en") {
    return null;
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_tag_translations")
    .select(BLOG_TAG_TRANSLATION_COLUMNS)
    .eq("blog_tag_id", tagId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog tag translation", {
      tagId,
      locale,
      error,
    });
    return null;
  }

  return (data ?? null) as BlogTagTranslationRow | null;
}

async function fetchAuthorTranslationByAuthorId(
  authorId: string,
  locale: PublicLocale,
) {
  if (locale === "en") {
    return null;
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_author_translations")
    .select(BLOG_AUTHOR_TRANSLATION_COLUMNS)
    .eq("blog_author_id", authorId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog author translation", {
      authorId,
      locale,
      error,
    });
    return null;
  }

  return (data ?? null) as BlogAuthorTranslationRow | null;
}

async function fetchPostTranslationByPostId(
  postId: string,
  locale: PublicLocale,
) {
  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_post_translations")
    .select(BLOG_POST_TRANSLATION_COLUMNS)
    .eq("blog_post_id", postId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog post translation", {
      postId,
      locale,
      error,
    });
    return null;
  }

  return (data ?? null) as BlogPostTranslationRow | null;
}

async function fetchCategoryTranslations(
  categoryIds: string[],
  locale: PublicLocale,
) {
  if (locale === "en" || categoryIds.length === 0) {
    return new Map<string, BlogCategoryTranslationRow>();
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_category_translations")
    .select(BLOG_CATEGORY_TRANSLATION_COLUMNS)
    .eq("locale", locale)
    .in("blog_category_id", categoryIds);

  if (error) {
    console.error("Failed to load blog category translations", {
      categoryIds,
      locale,
      error,
    });
    return new Map<string, BlogCategoryTranslationRow>();
  }

  return new Map<string, BlogCategoryTranslationRow>(
    ((data ?? []) as BlogCategoryTranslationRow[]).map((row) => [
      row.blog_category_id,
      row,
    ]),
  );
}

async function fetchTagTranslations(tagIds: string[], locale: PublicLocale) {
  if (locale === "en" || tagIds.length === 0) {
    return new Map<string, BlogTagTranslationRow>();
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_tag_translations")
    .select(BLOG_TAG_TRANSLATION_COLUMNS)
    .eq("locale", locale)
    .in("blog_tag_id", tagIds);

  if (error) {
    console.error("Failed to load blog tag translations", {
      tagIds,
      locale,
      error,
    });
    return new Map<string, BlogTagTranslationRow>();
  }

  return new Map<string, BlogTagTranslationRow>(
    ((data ?? []) as BlogTagTranslationRow[]).map((row) => [
      row.blog_tag_id,
      row,
    ]),
  );
}

async function fetchAuthorTranslations(
  authorIds: string[],
  locale: PublicLocale,
) {
  if (locale === "en" || authorIds.length === 0) {
    return new Map<string, BlogAuthorTranslationRow>();
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_author_translations")
    .select(BLOG_AUTHOR_TRANSLATION_COLUMNS)
    .eq("locale", locale)
    .in("blog_author_id", authorIds);

  if (error) {
    console.error("Failed to load blog author translations", {
      authorIds,
      locale,
      error,
    });
    return new Map<string, BlogAuthorTranslationRow>();
  }

  return new Map<string, BlogAuthorTranslationRow>(
    ((data ?? []) as BlogAuthorTranslationRow[]).map((row) => [
      row.blog_author_id,
      row,
    ]),
  );
}

async function fetchPostTranslations(postIds: string[], locale: PublicLocale) {
  if (postIds.length === 0) {
    return new Map<string, BlogPostTranslationRow>();
  }

  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_post_translations")
    .select(BLOG_POST_TRANSLATION_COLUMNS)
    .eq("locale", locale)
    .in("blog_post_id", postIds);

  if (error) {
    console.error("Failed to load blog post translations", {
      postIds,
      locale,
      error,
    });
    return new Map<string, BlogPostTranslationRow>();
  }

  return new Map<string, BlogPostTranslationRow>(
    ((data ?? []) as BlogPostTranslationRow[]).map((row) => [
      row.blog_post_id,
      row,
    ]),
  );
}

function localizeCategoryEntry(
  entry: BlogCategoryEntry,
  locale: PublicLocale,
  publishedOnly = true,
): LocalizedBlogCategory | null {
  if (
    locale === "ar" &&
    (!entry.translation ||
      !isLocalePublished(locale, entry.translation.status, publishedOnly))
  ) {
    return null;
  }

  const localizedSlug =
    locale === "ar"
      ? (cleanText(entry.translation?.slug) ?? null)
      : (entry.base.slug ?? null);
  if (!localizedSlug) {
    return null;
  }

  return {
    id: entry.base.id,
    name:
      locale === "ar"
        ? (cleanText(entry.translation?.name) ?? entry.base.name)
        : entry.base.name,
    slug: localizedSlug,
    description:
      locale === "ar"
        ? (cleanText(entry.translation?.description) ?? entry.base.description)
        : entry.base.description,
    color: entry.base.color,
    order: entry.base.order,
    status:
      locale === "ar"
        ? ((entry.translation?.status ?? "draft") as "draft" | "published")
        : "published",
    updated_at:
      locale === "ar"
        ? (entry.translation?.updated_at ?? entry.base.updated_at)
        : entry.base.updated_at,
    locale,
    base_slug: entry.base.slug,
    path: buildLocalizedBlogCategoryPath(localizedSlug, locale),
  };
}

function localizeTagEntry(
  entry: BlogTagEntry,
  locale: PublicLocale,
  publishedOnly = true,
): LocalizedBlogTag | null {
  if (
    locale === "ar" &&
    (!entry.translation ||
      !isLocalePublished(locale, entry.translation.status, publishedOnly))
  ) {
    return null;
  }

  const localizedSlug =
    locale === "ar"
      ? (cleanText(entry.translation?.slug) ?? null)
      : (entry.base.slug ?? null);
  if (!localizedSlug) {
    return null;
  }

  return {
    id: entry.base.id,
    name:
      locale === "ar"
        ? (cleanText(entry.translation?.name) ?? entry.base.name)
        : entry.base.name,
    slug: localizedSlug,
    description:
      locale === "ar" ? cleanText(entry.translation?.description) : null,
    status:
      locale === "ar"
        ? ((entry.translation?.status ?? "draft") as "draft" | "published")
        : "published",
    updated_at:
      locale === "ar"
        ? (entry.translation?.updated_at ?? entry.base.created_at)
        : entry.base.created_at,
    locale,
    base_slug: entry.base.slug,
    path: buildLocalizedBlogTagPath(localizedSlug, locale),
  };
}

function localizeAuthorEntry(
  entry: BlogAuthorEntry,
  locale: PublicLocale,
  publishedOnly = true,
): LocalizedBlogAuthor | null {
  if (
    locale === "ar" &&
    (!entry.translation ||
      !isLocalePublished(locale, entry.translation.status, publishedOnly))
  ) {
    return null;
  }

  const localizedSlug =
    locale === "ar"
      ? (cleanText(entry.translation?.slug) ?? null)
      : (entry.base.slug ?? null);
  if (!localizedSlug || entry.base.active === false) {
    return null;
  }

  return {
    id: entry.base.id,
    name:
      locale === "ar"
        ? (cleanText(entry.translation?.name) ?? entry.base.name)
        : entry.base.name,
    slug: localizedSlug,
    bio:
      locale === "ar"
        ? (cleanText(entry.translation?.bio) ?? entry.base.bio)
        : entry.base.bio,
    avatar: entry.base.avatar,
    website: entry.base.website,
    social_links: entry.base.social_links,
    active: entry.base.active ?? true,
    status:
      locale === "ar"
        ? ((entry.translation?.status ?? "draft") as "draft" | "published")
        : "published",
    updated_at:
      locale === "ar"
        ? (entry.translation?.updated_at ?? entry.base.updated_at)
        : entry.base.updated_at,
    locale,
    base_slug: entry.base.slug,
    path: buildLocalizedBlogAuthorPath(localizedSlug, locale),
  };
}

function localizePostEntry(input: {
  entry: BlogPostEntry;
  locale: PublicLocale;
  category: LocalizedBlogCategory | null;
  author: LocalizedBlogAuthor | null;
  tags: LocalizedBlogTag[];
  publishedOnly?: boolean;
}): LocalizedBlogPost | null {
  const { entry, locale, category, author, tags, publishedOnly = true } = input;

  if (!isPublicPostStatus(entry.base.status)) {
    return null;
  }

  if (
    locale === "ar" &&
    (!entry.translation ||
      !isLocalePublished(locale, entry.translation.status, publishedOnly))
  ) {
    return null;
  }

  const localizedSlug =
    locale === "ar"
      ? (cleanText(entry.translation?.slug) ?? null)
      : (entry.base.slug ?? null);
  if (!localizedSlug) {
    return null;
  }

  const content =
    locale === "ar" && entry.translation
      ? (entry.translation.content ?? EMPTY_TRANSLATED_POST_CONTENT)
      : entry.base.content;

  return {
    id: entry.base.id,
    slug: localizedSlug,
    title:
      locale === "ar"
        ? (cleanText(entry.translation?.title) ?? "")
        : entry.base.title,
    excerpt:
      locale === "ar"
        ? cleanText(entry.translation?.excerpt)
        : entry.base.excerpt,
    content,
    featured_image: entry.base.featured_image,
    publish_date: entry.base.publish_date,
    reading_time: entry.base.reading_time,
    view_count: entry.base.view_count,
    featured: entry.base.featured === true,
    seo_title:
      locale === "ar"
        ? cleanText(entry.translation?.seo_title)
        : entry.base.seo_title,
    seo_description:
      locale === "ar"
        ? cleanText(entry.translation?.seo_description)
        : entry.base.seo_description,
    seo_keywords:
      locale === "ar"
        ? cleanText(entry.translation?.seo_keywords)
        : entry.base.seo_keywords,
    og_image:
      locale === "ar"
        ? cleanText(entry.translation?.og_image)
        : entry.base.og_image,
    status: entry.base.status as "draft" | "published" | "scheduled",
    updated_at:
      locale === "ar"
        ? (entry.translation?.updated_at ?? entry.base.updated_at)
        : entry.base.updated_at,
    locale,
    base_slug: entry.base.slug,
    path:
      category && localizedSlug
        ? buildLocalizedBlogPostPath(category.slug, localizedSlug, locale)
        : null,
    category,
    author,
    tags,
  };
}

export async function findBlogCategoryEntryBySlug(
  slug: string,
  lookupLocale: PublicLocale,
): Promise<BlogCategoryEntry | null> {
  const supabase = asSupabase();

  if (lookupLocale === "en") {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug, description, color, order, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      base: data as BlogCategoryBaseRow,
      translation: null,
    };
  }

  const { data: translation, error: translationError } = await supabase
    .from("blog_category_translations")
    .select(BLOG_CATEGORY_TRANSLATION_COLUMNS)
    .eq("locale", lookupLocale)
    .eq("slug", slug)
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  const { data: base, error: baseError } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, color, order, updated_at")
    .eq("id", translation.blog_category_id)
    .maybeSingle();

  if (baseError || !base) {
    return null;
  }

  return {
    base: base as BlogCategoryBaseRow,
    translation: translation as BlogCategoryTranslationRow,
  };
}

export async function findBlogTagEntryBySlug(
  slug: string,
  lookupLocale: PublicLocale,
): Promise<BlogTagEntry | null> {
  const supabase = asSupabase();

  if (lookupLocale === "en") {
    const { data, error } = await supabase
      .from("blog_tags")
      .select("id, name, slug, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      base: data as BlogTagBaseRow,
      translation: null,
    };
  }

  const { data: translation, error: translationError } = await supabase
    .from("blog_tag_translations")
    .select(BLOG_TAG_TRANSLATION_COLUMNS)
    .eq("locale", lookupLocale)
    .eq("slug", slug)
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  const { data: base, error: baseError } = await supabase
    .from("blog_tags")
    .select("id, name, slug, created_at")
    .eq("id", translation.blog_tag_id)
    .maybeSingle();

  if (baseError || !base) {
    return null;
  }

  return {
    base: base as BlogTagBaseRow,
    translation: translation as BlogTagTranslationRow,
  };
}

export async function findBlogAuthorEntryBySlug(
  slug: string,
  lookupLocale: PublicLocale,
): Promise<BlogAuthorEntry | null> {
  const supabase = asSupabase();

  if (lookupLocale === "en") {
    const { data, error } = await supabase
      .from("blog_authors")
      .select(
        "id, name, slug, bio, avatar, website, social_links, active, updated_at",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      base: data as BlogAuthorBaseRow,
      translation: null,
    };
  }

  const { data: translation, error: translationError } = await supabase
    .from("blog_author_translations")
    .select(BLOG_AUTHOR_TRANSLATION_COLUMNS)
    .eq("locale", lookupLocale)
    .eq("slug", slug)
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  const { data: base, error: baseError } = await supabase
    .from("blog_authors")
    .select(
      "id, name, slug, bio, avatar, website, social_links, active, updated_at",
    )
    .eq("id", translation.blog_author_id)
    .maybeSingle();

  if (baseError || !base) {
    return null;
  }

  return {
    base: base as BlogAuthorBaseRow,
    translation: translation as BlogAuthorTranslationRow,
  };
}

async function findBlogPostEntryBySlug(
  slug: string,
  lookupLocale: PublicLocale,
): Promise<BlogPostEntry | null> {
  const supabase = asSupabase();

  if (lookupLocale === "en") {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, featured_image, category_id, author_id, status, publish_date, reading_time, view_count, seo_title, seo_description, seo_keywords, og_image, featured, updated_at",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      base: data as BlogPostBaseRow,
      translation: null,
    };
  }

  const { data: translation, error: translationError } = await supabase
    .from("blog_post_translations")
    .select(BLOG_POST_TRANSLATION_COLUMNS)
    .eq("locale", lookupLocale)
    .eq("slug", slug)
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  const { data: base, error: baseError } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image, category_id, author_id, status, publish_date, reading_time, view_count, seo_title, seo_description, seo_keywords, og_image, featured, updated_at",
    )
    .eq("id", translation.blog_post_id)
    .maybeSingle();

  if (baseError || !base) {
    return null;
  }

  return {
    base: base as BlogPostBaseRow,
    translation: translation as BlogPostTranslationRow,
  };
}

export async function getLocalizedBlogCategoryBySlug(input: {
  slug: string;
  locale: PublicLocale;
  lookupLocale?: PublicLocale;
  publishedOnly?: boolean;
}) {
  const entry = await findBlogCategoryEntryBySlug(
    input.slug,
    input.lookupLocale ?? input.locale,
  );
  if (!entry) {
    return null;
  }

  const translation =
    input.locale === "ar"
      ? (entry.translation ??
        (await fetchCategoryTranslationByCategoryId(
          entry.base.id,
          input.locale,
        )))
      : null;
  return localizeCategoryEntry(
    { base: entry.base, translation },
    input.locale,
    input.publishedOnly ?? true,
  );
}

export async function getLocalizedBlogTagBySlug(input: {
  slug: string;
  locale: PublicLocale;
  lookupLocale?: PublicLocale;
  publishedOnly?: boolean;
}) {
  const entry = await findBlogTagEntryBySlug(
    input.slug,
    input.lookupLocale ?? input.locale,
  );
  if (!entry) {
    return null;
  }

  const translation =
    input.locale === "ar"
      ? (entry.translation ??
        (await fetchTagTranslationByTagId(entry.base.id, input.locale)))
      : null;
  return localizeTagEntry(
    { base: entry.base, translation },
    input.locale,
    input.publishedOnly ?? true,
  );
}

export async function getLocalizedBlogAuthorBySlug(input: {
  slug: string;
  locale: PublicLocale;
  lookupLocale?: PublicLocale;
  publishedOnly?: boolean;
}) {
  const entry = await findBlogAuthorEntryBySlug(
    input.slug,
    input.lookupLocale ?? input.locale,
  );
  if (!entry) {
    return null;
  }

  const translation =
    input.locale === "ar"
      ? (entry.translation ??
        (await fetchAuthorTranslationByAuthorId(entry.base.id, input.locale)))
      : null;
  return localizeAuthorEntry(
    { base: entry.base, translation },
    input.locale,
    input.publishedOnly ?? true,
  );
}

async function getLocalizedBlogTagsByPostId(
  postId: string,
  locale: PublicLocale,
  publishedOnly = true,
) {
  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("blog_post_tags")
    .select("tag:blog_tags(id, name, slug, created_at)")
    .eq("post_id", postId);

  if (error) {
    console.error("Failed to load blog post tags", { postId, error });
    return [];
  }

  const baseTags = ((data ?? []).map((row: any) => row.tag).filter(Boolean) ??
    []) as BlogTagBaseRow[];
  const translations = await fetchTagTranslations(
    baseTags.map((tag) => tag.id),
    locale,
  );

  return baseTags
    .map((tag) =>
      localizeTagEntry(
        {
          base: tag,
          translation: translations.get(tag.id) ?? null,
        },
        locale,
        publishedOnly,
      ),
    )
    .filter((entry): entry is LocalizedBlogTag => Boolean(entry));
}

export async function getLocalizedBlogPostByPath(input: {
  categorySlug: string;
  postSlug: string;
  locale: PublicLocale;
  lookupLocale?: PublicLocale;
  publishedOnly?: boolean;
  incrementViewCount?: boolean;
}) {
  const lookupLocale = input.lookupLocale ?? input.locale;
  const publishedOnly = input.publishedOnly ?? true;
  const categoryEntry = await findBlogCategoryEntryBySlug(
    input.categorySlug,
    lookupLocale,
  );
  if (!categoryEntry) {
    return null;
  }

  const postEntry = await findBlogPostEntryBySlug(input.postSlug, lookupLocale);
  if (!postEntry || postEntry.base.category_id !== categoryEntry.base.id) {
    return null;
  }

  if (publishedOnly) {
    if (postEntry.base.status !== "published") {
      return null;
    }
    if (
      postEntry.base.publish_date &&
      Date.parse(postEntry.base.publish_date) > Date.now()
    ) {
      return null;
    }
  }

  const [
    categoryTranslation,
    postTranslation,
    authorBase,
    authorTranslation,
    tags,
  ] = await Promise.all([
    input.locale === "ar"
      ? (categoryEntry.translation ??
        fetchCategoryTranslationByCategoryId(
          categoryEntry.base.id,
          input.locale,
        ))
      : Promise.resolve(null),
    input.locale === "ar"
      ? (postEntry.translation ??
        fetchPostTranslationByPostId(postEntry.base.id, input.locale))
      : Promise.resolve(null),
    postEntry.base.author_id
      ? asSupabase()
          .from("blog_authors")
          .select(
            "id, name, slug, bio, avatar, website, social_links, active, updated_at",
          )
          .eq("id", postEntry.base.author_id)
          .maybeSingle()
          .then((result: any) => result.data as BlogAuthorBaseRow | null)
      : Promise.resolve(null),
    postEntry.base.author_id && input.locale === "ar"
      ? fetchAuthorTranslationByAuthorId(postEntry.base.author_id, input.locale)
      : Promise.resolve(null),
    getLocalizedBlogTagsByPostId(
      postEntry.base.id,
      input.locale,
      publishedOnly,
    ),
  ]);

  const category = localizeCategoryEntry(
    { base: categoryEntry.base, translation: categoryTranslation },
    input.locale,
    publishedOnly,
  );
  if (!category) {
    return null;
  }

  const author =
    authorBase && authorBase.active !== false
      ? localizeAuthorEntry(
          {
            base: authorBase,
            translation: authorTranslation,
          },
          input.locale,
          false,
        )
      : null;

  const post = localizePostEntry({
    entry: {
      base: postEntry.base,
      translation: postTranslation,
    },
    locale: input.locale,
    category,
    author,
    tags,
    publishedOnly,
  });

  if (!post) {
    return null;
  }

  if (input.incrementViewCount) {
    const supabase = asSupabase();
    void supabase.rpc("increment_blog_post_view_count", {
      post_id: post.id,
    });
  }

  return post;
}

export async function listLocalizedBlogPosts(input: {
  locale: PublicLocale;
  page?: number;
  limit?: number;
  search?: string | null;
  categoryId?: string | null;
  tagId?: string | null;
  authorId?: string | null;
  featuredOnly?: boolean;
  manualBaseSlugs?: string[];
  excludePostId?: string | null;
  publishedOnly?: boolean;
}) {
  const supabase = asSupabase();
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, Math.min(24, input.limit ?? 12));
  const offset = (page - 1) * limit;
  const publishedOnly = input.publishedOnly ?? true;

  let allowedPostIds: string[] | null = null;
  if (input.tagId) {
    const { data: tagRows, error: tagError } = await supabase
      .from("blog_post_tags")
      .select("post_id")
      .eq("tag_id", input.tagId);

    if (tagError) {
      console.error("Failed to load blog tag post ids", {
        tagId: input.tagId,
        tagError,
      });
      return { posts: [], total: 0, page, limit, totalPages: 0 };
    }

    allowedPostIds = (tagRows ?? []).map((row: any) => row.post_id);
    if (allowedPostIds.length === 0) {
      return { posts: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  if (input.manualBaseSlugs && input.manualBaseSlugs.length > 0) {
    const { data: manualRows, error: manualError } = await supabase
      .from("blog_posts")
      .select("id, slug")
      .in("slug", input.manualBaseSlugs);

    if (manualError) {
      console.error("Failed to resolve manual blog post slugs", {
        manualBaseSlugs: input.manualBaseSlugs,
        manualError,
      });
      return { posts: [], total: 0, page, limit, totalPages: 0 };
    }

    const manualIds = (manualRows ?? []).map((row: any) => row.id);
    allowedPostIds = allowedPostIds
      ? allowedPostIds.filter((id) => manualIds.includes(id))
      : manualIds;
    if (allowedPostIds.length === 0) {
      return { posts: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  let query = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image, category_id, author_id, status, publish_date, reading_time, view_count, seo_title, seo_description, seo_keywords, og_image, featured, updated_at",
      { count: "exact" },
    );

  if (publishedOnly) {
    query = query.eq("status", "published");
    query = query.or(`publish_date.is.null,publish_date.lte.${nowIso()}`);
  }

  if (input.categoryId) {
    query = query.eq("category_id", input.categoryId);
  }

  if (input.authorId) {
    query = query.eq("author_id", input.authorId);
  }

  if (input.featuredOnly) {
    query = query.eq("featured", true);
  }

  if (input.excludePostId) {
    query = query.neq("id", input.excludePostId);
  }

  if (allowedPostIds) {
    query = query.in("id", allowedPostIds);
  }

  if (input.search && input.search.trim().length > 0) {
    const searchValue = input.search.trim();
    if (input.locale === "ar") {
      const { data: translatedMatches } = await supabase
        .from("blog_post_translations")
        .select("blog_post_id")
        .eq("locale", "ar")
        .or(`title.ilike.%${searchValue}%,excerpt.ilike.%${searchValue}%`);
      const translatedIds = (translatedMatches ?? []).map(
        (row: any) => row.blog_post_id,
      );
      if (translatedIds.length > 0) {
        query = query.in("id", translatedIds);
      } else {
        query = query.or(
          `title.ilike.%${searchValue}%,excerpt.ilike.%${searchValue}%`,
        );
      }
    } else {
      query = query.or(
        `title.ilike.%${searchValue}%,excerpt.ilike.%${searchValue}%`,
      );
    }
  }

  const {
    data: rows,
    error,
    count,
  } = await query
    .order("featured", { ascending: false })
    .order("publish_date", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to load localized blog posts", { input, error });
    return { posts: [], total: 0, page, limit, totalPages: 0 };
  }

  const basePosts = (rows ?? []) as BlogPostBaseRow[];
  const postTranslations = await fetchPostTranslations(
    basePosts.map((row) => row.id),
    input.locale,
  );
  const categoryIds = Array.from(
    new Set(basePosts.map((row) => row.category_id).filter(Boolean)),
  ) as string[];
  const authorIds = Array.from(
    new Set(basePosts.map((row) => row.author_id).filter(Boolean)),
  ) as string[];
  const tagRows = await Promise.all(
    basePosts.map((row) =>
      getLocalizedBlogTagsByPostId(row.id, input.locale, publishedOnly),
    ),
  );

  const [
    categoryBaseRows,
    categoryTranslations,
    authorBaseRows,
    authorTranslations,
  ] = await Promise.all([
    categoryIds.length > 0
      ? supabase
          .from("blog_categories")
          .select("id, name, slug, description, color, order, updated_at")
          .in("id", categoryIds)
          .then((result: any) => result.data ?? [])
      : Promise.resolve([]),
    fetchCategoryTranslations(categoryIds, input.locale),
    authorIds.length > 0
      ? supabase
          .from("blog_authors")
          .select(
            "id, name, slug, bio, avatar, website, social_links, active, updated_at",
          )
          .in("id", authorIds)
          .then((result: any) => result.data ?? [])
      : Promise.resolve([]),
    fetchAuthorTranslations(authorIds, input.locale),
  ]);

  const categoryMap = new Map<string, BlogCategoryBaseRow>(
    (categoryBaseRows as BlogCategoryBaseRow[]).map((row) => [row.id, row]),
  );
  const authorMap = new Map<string, BlogAuthorBaseRow>(
    (authorBaseRows as BlogAuthorBaseRow[]).map((row) => [row.id, row]),
  );

  const posts = basePosts
    .map((row, index) => {
      const categoryBase = row.category_id
        ? categoryMap.get(row.category_id)
        : null;
      const authorBase = row.author_id ? authorMap.get(row.author_id) : null;
      const category = categoryBase
        ? localizeCategoryEntry(
            {
              base: categoryBase,
              translation: categoryTranslations.get(categoryBase.id) ?? null,
            },
            input.locale,
            publishedOnly,
          )
        : null;
      const author =
        authorBase && authorBase.active !== false
          ? localizeAuthorEntry(
              {
                base: authorBase,
                translation: authorTranslations.get(authorBase.id) ?? null,
              },
              input.locale,
              false,
            )
          : null;
      return localizePostEntry({
        entry: {
          base: row,
          translation: postTranslations.get(row.id) ?? null,
        },
        locale: input.locale,
        category,
        author,
        tags: tagRows[index] ?? [],
        publishedOnly,
      });
    })
    .filter((entry): entry is LocalizedBlogPost => Boolean(entry));

  const total = count ?? posts.length;
  return {
    posts,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  } satisfies BlogPostListResult;
}

export async function listLocalizedBlogTaxonomy(input: {
  locale: PublicLocale;
  type: "categories" | "tags" | "authors";
  publishedOnly?: boolean;
}) {
  const supabase = asSupabase();
  const publishedOnly = input.publishedOnly ?? true;

  if (input.type === "categories") {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug, description, color, order, updated_at")
      .order("order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load blog categories", { error });
      return [];
    }

    const baseRows = (data ?? []) as BlogCategoryBaseRow[];
    const translations = await fetchCategoryTranslations(
      baseRows.map((row) => row.id),
      input.locale,
    );
    return baseRows
      .map((row) =>
        localizeCategoryEntry(
          {
            base: row,
            translation: translations.get(row.id) ?? null,
          },
          input.locale,
          publishedOnly,
        ),
      )
      .filter((entry): entry is LocalizedBlogCategory => Boolean(entry));
  }

  if (input.type === "tags") {
    const { data, error } = await supabase
      .from("blog_tags")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load blog tags", { error });
      return [];
    }

    const baseRows = (data ?? []) as BlogTagBaseRow[];
    const translations = await fetchTagTranslations(
      baseRows.map((row) => row.id),
      input.locale,
    );
    return baseRows
      .map((row) =>
        localizeTagEntry(
          {
            base: row,
            translation: translations.get(row.id) ?? null,
          },
          input.locale,
          publishedOnly,
        ),
      )
      .filter((entry): entry is LocalizedBlogTag => Boolean(entry));
  }

  const { data, error } = await supabase
    .from("blog_authors")
    .select(
      "id, name, slug, bio, avatar, website, social_links, active, updated_at",
    )
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load blog authors", { error });
    return [];
  }

  const baseRows = (data ?? []) as BlogAuthorBaseRow[];
  const translations = await fetchAuthorTranslations(
    baseRows.map((row) => row.id),
    input.locale,
  );
  return baseRows
    .map((row) =>
      localizeAuthorEntry(
        {
          base: row,
          translation: translations.get(row.id) ?? null,
        },
        input.locale,
        publishedOnly,
      ),
    )
    .filter((entry): entry is LocalizedBlogAuthor => Boolean(entry));
}

export async function getLocalizedBlogTemplatePage(
  slug: string,
  locale: PublicLocale,
) {
  return getLocalizedCmsPageRecordBySlug(slug, locale);
}

export async function resolveLocalizedBlogSwitchPath(
  pathname: string,
  targetLocale: PublicLocale,
) {
  const sourceLocale: PublicLocale =
    pathname.startsWith("/ar/") || pathname === "/ar" ? "ar" : "en";
  const normalized = stripLocalePrefix(pathname);

  if (normalized === "/blog") {
    const page = await getLocalizedCmsPageRecordBySlug("blog", targetLocale);
    return page ? buildLocalizedBlogLandingPath(targetLocale) : null;
  }

  if (normalized.startsWith("/blog/tag/")) {
    const slug = normalized.slice("/blog/tag/".length);
    const tag = await getLocalizedBlogTagBySlug({
      slug,
      locale: targetLocale,
      lookupLocale: sourceLocale,
      publishedOnly: targetLocale === "ar",
    });
    return tag?.path ?? null;
  }

  if (normalized.startsWith("/blog/author/")) {
    const slug = normalized.slice("/blog/author/".length);
    const author = await getLocalizedBlogAuthorBySlug({
      slug,
      locale: targetLocale,
      lookupLocale: sourceLocale,
      publishedOnly: targetLocale === "ar",
    });
    return author?.path ?? null;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] === "blog") {
    const category = await getLocalizedBlogCategoryBySlug({
      slug: decodePathSegment(segments[1]),
      locale: targetLocale,
      lookupLocale: sourceLocale,
      publishedOnly: targetLocale === "ar",
    });
    return category?.path ?? null;
  }

  if (segments.length === 3 && segments[0] === "blog") {
    const post = await getLocalizedBlogPostByPath({
      categorySlug: decodePathSegment(segments[1]),
      postSlug: decodePathSegment(segments[2]),
      locale: targetLocale,
      lookupLocale: sourceLocale,
      publishedOnly: targetLocale === "ar",
    });
    return post?.path ?? null;
  }

  return null;
}
