import {
  DEFAULT_SEO_LOCALE,
  STATIC_PUBLIC_ROUTE_DEFAULTS,
} from "@/lib/seo/constants";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { normalizePath } from "@/lib/seo/utils";
import { ApiError } from "@/server/utils/errors";
import type {
  PublicInventoryEntry,
  RouteRedirectRow,
  SeoLocale,
  SeoOverrideRow,
} from "@/lib/seo/types";

const nowIso = () => new Date().toISOString();

const asSupabase = () => getSupabaseAdmin() as any;

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

type InventoryOverrideRow = Pick<
  SeoOverrideRow,
  | "route_key"
  | "locale"
  | "title"
  | "description"
  | "og_image_url"
  | "robots_index"
>;

function computeNeedsSeoScore(input: {
  hasTitle: boolean;
  hasDescription: boolean;
  hasImage: boolean;
  hasOverride: boolean;
}) {
  let score = 0;

  if (!input.hasTitle) score += 50;
  if (!input.hasDescription) score += 35;
  if (!input.hasImage) score += 10;
  if (!input.hasOverride) score += 5;

  return clampScore(score);
}

function buildOverrideLookup(rows: InventoryOverrideRow[], locale: SeoLocale) {
  const map = new Map<string, InventoryOverrideRow>();

  for (const row of rows) {
    const key = normalizePath(row.route_key);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, row);
      continue;
    }

    const existingPriority = existing.locale === locale ? 2 : 1;
    const nextPriority = row.locale === locale ? 2 : 1;

    if (nextPriority > existingPriority) {
      map.set(key, row);
    }
  }

  return map;
}

function buildExactLocaleOverrideLookup(
  rows: InventoryOverrideRow[],
  locale: SeoLocale,
) {
  const map = new Map<string, InventoryOverrideRow>();

  for (const row of rows) {
    if (row.locale !== locale) continue;
    map.set(normalizePath(row.route_key), row);
  }

  return map;
}

function readCmsSeoField(
  seo: Record<string, unknown> | null | undefined,
  key: "title" | "description" | "ogImage",
) {
  const value = seo?.[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function fetchSeoOverrideForRoute(options: {
  routeKey: string;
  pathname?: string;
  locale?: SeoLocale;
}): Promise<SeoOverrideRow | null> {
  const locale = options.locale ?? DEFAULT_SEO_LOCALE;
  const routeKey = normalizePath(options.routeKey);
  const pathname = normalizePath(options.pathname ?? options.routeKey);

  const keys = Array.from(new Set([routeKey, pathname]));
  const supabase = asSupabase();

  const { data, error } = await supabase
    .from("seo_overrides")
    .select("*")
    .in("route_key", keys)
    .in("locale", [locale, DEFAULT_SEO_LOCALE]);

  if (error) {
    console.error("Failed to fetch SEO override for route", {
      routeKey,
      pathname,
      locale,
      error,
    });
    return null;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const rows = data as SeoOverrideRow[];
  const ranked = [...rows].sort((a, b) => {
    const score = (row: SeoOverrideRow) => {
      let value = 0;
      if (normalizePath(row.route_key) === pathname) value += 100;
      if (normalizePath(row.route_key) === routeKey) value += 50;
      if (row.locale === locale) value += 10;
      return value;
    };

    return score(b) - score(a);
  });

  return ranked[0] ?? null;
}

export async function listSeoOverrides(options?: {
  locale?: SeoLocale;
  routeKey?: string;
}) {
  const supabase = asSupabase();
  let query = supabase
    .from("seo_overrides")
    .select("*")
    .order("route_key", { ascending: true })
    .order("locale", { ascending: true });

  if (options?.locale) {
    query = query.eq("locale", options.locale);
  }

  if (options?.routeKey) {
    query = query.eq("route_key", normalizePath(options.routeKey));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SeoOverrideRow[];
}

export async function upsertSeoOverride(input: {
  routeKey: string;
  locale: SeoLocale;
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: string | null;
  keywords?: string[] | null;
  schemaOverride?: unknown;
  aiSummary?: string | null;
  llmsInclude?: boolean;
  llmsPriority?: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}): Promise<SeoOverrideRow> {
  const supabase = asSupabase();
  const routeKey = normalizePath(input.routeKey);
  const expectedUpdatedAt =
    typeof input.updatedAt === "string" && input.updatedAt.trim().length > 0
      ? input.updatedAt
      : null;

  const { data: existing, error: existingError } = await supabase
    .from("seo_overrides")
    .select("*")
    .eq("route_key", routeKey)
    .eq("locale", input.locale)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(
      500,
      "Failed to load SEO override",
      existingError.message,
    );
  }

  const current = (existing ?? null) as SeoOverrideRow | null;
  if (current) {
    if (!expectedUpdatedAt) {
      throw new ApiError(
        409,
        "This SEO override has a newer version. Refresh and try again.",
      );
    }

    if (current.updated_at !== expectedUpdatedAt) {
      throw new ApiError(
        409,
        "This SEO override was updated by another editor. Refresh and retry.",
      );
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: input.updatedBy ?? null,
    };

    const assignIfDefined = (key: string, value: unknown) => {
      if (value !== undefined) {
        updatePayload[key] = value;
      }
    };

    assignIfDefined("title", input.title);
    assignIfDefined("description", input.description);
    assignIfDefined("canonical_url", input.canonicalUrl);
    assignIfDefined("robots_index", input.robotsIndex);
    assignIfDefined("robots_follow", input.robotsFollow);
    assignIfDefined("og_title", input.ogTitle);
    assignIfDefined("og_description", input.ogDescription);
    assignIfDefined("og_image_url", input.ogImageUrl);
    assignIfDefined("twitter_title", input.twitterTitle);
    assignIfDefined("twitter_description", input.twitterDescription);
    assignIfDefined("twitter_image_url", input.twitterImageUrl);
    assignIfDefined("keywords", input.keywords);
    assignIfDefined("schema_override", input.schemaOverride);
    assignIfDefined("ai_summary", input.aiSummary);
    assignIfDefined("llms_include", input.llmsInclude);
    assignIfDefined("llms_priority", input.llmsPriority);

    const { data, error } = await supabase
      .from("seo_overrides")
      .update(updatePayload)
      .eq("id", current.id)
      .eq("updated_at", expectedUpdatedAt)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update SEO override", error.message);
    }

    if (!data) {
      throw new ApiError(
        409,
        "This SEO override was updated by another editor. Refresh and retry.",
      );
    }

    return data as SeoOverrideRow;
  }

  const insertPayload = {
    route_key: routeKey,
    locale: input.locale,
    title: input.title ?? null,
    description: input.description ?? null,
    canonical_url: input.canonicalUrl ?? null,
    robots_index: input.robotsIndex ?? true,
    robots_follow: input.robotsFollow ?? true,
    og_title: input.ogTitle ?? null,
    og_description: input.ogDescription ?? null,
    og_image_url: input.ogImageUrl ?? null,
    twitter_title: input.twitterTitle ?? null,
    twitter_description: input.twitterDescription ?? null,
    twitter_image_url: input.twitterImageUrl ?? null,
    keywords: input.keywords ?? null,
    schema_override: input.schemaOverride ?? null,
    ai_summary: input.aiSummary ?? null,
    llms_include: input.llmsInclude ?? true,
    llms_priority: input.llmsPriority ?? 0,
    updated_by: input.updatedBy ?? null,
  };

  const { data, error } = await supabase
    .from("seo_overrides")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new ApiError(
        409,
        "This SEO override was created by another editor. Refresh and retry.",
      );
    }

    throw new ApiError(
      500,
      "Failed to create SEO override",
      error?.message ?? "Unknown error",
    );
  }

  return data as SeoOverrideRow;
}

export async function resolveRouteRedirect(
  pathname: string,
): Promise<RouteRedirectRow | null> {
  const supabase = asSupabase();
  const normalizedPath = normalizePath(pathname);

  const { data, error } = await supabase
    .from("route_redirects")
    .select("*")
    .eq("from_path", normalizedPath)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve route redirect", {
      pathname: normalizedPath,
      error,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return data as RouteRedirectRow;
}

export async function listRouteRedirects() {
  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("route_redirects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RouteRedirectRow[];
}

async function getRouteRedirectByFromPath(fromPath: string) {
  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("route_redirects")
    .select("*")
    .eq("from_path", normalizePath(fromPath))
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load redirect by source path", error);
  }

  return (data ?? null) as RouteRedirectRow | null;
}

export async function getRouteRedirectById(id: string) {
  const supabase = asSupabase();
  const { data, error } = await supabase
    .from("route_redirects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load redirect", error);
  }

  return (data ?? null) as RouteRedirectRow | null;
}

async function hasRedirectCycle(input: {
  fromPath: string;
  toPath: string;
  ignoreId?: string;
}) {
  const supabase = asSupabase();
  const fromPath = normalizePath(input.fromPath);
  let cursor = normalizePath(input.toPath);
  const visited = new Set<string>();

  for (let depth = 0; depth < 64; depth += 1) {
    if (cursor === fromPath) {
      return true;
    }

    if (visited.has(cursor)) {
      // If the destination chain already loops, linking to it would still
      // create an infinite redirect path for callers of this redirect.
      return true;
    }
    visited.add(cursor);

    let query = supabase
      .from("route_redirects")
      .select("id, to_path")
      .eq("from_path", cursor)
      .eq("is_active", true);

    if (input.ignoreId) {
      query = query.neq("id", input.ignoreId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to validate redirect cycle", error);
    }

    if (!data) {
      return false;
    }

    cursor = normalizePath(data.to_path as string);
  }

  return true;
}

export async function createRouteRedirect(input: {
  fromPath: string;
  toPath: string;
  code?: 301 | 302 | 307 | 308;
  isActive?: boolean;
  source?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  mode?: "create" | "upsert";
}) {
  const supabase = asSupabase();
  const mode = input.mode ?? "upsert";
  const fromPath = normalizePath(input.fromPath);
  const toPath = normalizePath(input.toPath);

  if (fromPath === toPath) {
    throw new ApiError(400, "Redirect source and target cannot be identical");
  }

  const existing = await getRouteRedirectByFromPath(fromPath);
  if (mode === "create" && existing) {
    throw new ApiError(
      409,
      "A redirect already exists for this source path",
      existing.id,
    );
  }

  const nextIsActive = input.isActive ?? existing?.is_active ?? true;
  if (
    nextIsActive &&
    (await hasRedirectCycle({
      fromPath,
      toPath,
      ignoreId: existing?.id,
    }))
  ) {
    throw new ApiError(409, "Redirect would create a cycle");
  }

  if (existing) {
    const { data, error } = await supabase
      .from("route_redirects")
      .update({
        to_path: toPath,
        code: input.code ?? existing.code,
        is_active: nextIsActive,
        source: input.source !== undefined ? input.source : existing.source,
        source_metadata:
          input.sourceMetadata !== undefined
            ? input.sourceMetadata
            : existing.source_metadata,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(
        500,
        error?.message ?? "Failed to update existing redirect",
      );
    }

    return data as RouteRedirectRow;
  }

  const { data, error } = await supabase
    .from("route_redirects")
    .insert({
      from_path: fromPath,
      to_path: toPath,
      code: input.code ?? 301,
      is_active: nextIsActive,
      source: input.source ?? null,
      source_metadata: input.sourceMetadata ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError(500, error?.message ?? "Failed to create redirect");
  }

  return data as RouteRedirectRow;
}

export async function updateRouteRedirect(input: {
  id: string;
  fromPath?: string;
  toPath?: string;
  code?: 301 | 302 | 307 | 308;
  isActive?: boolean;
  source?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
}) {
  const supabase = asSupabase();
  const existing = await getRouteRedirectById(input.id);

  if (!existing) {
    throw new ApiError(404, "Redirect not found");
  }

  const payload: Record<string, unknown> = {};

  if (input.fromPath !== undefined) {
    payload.from_path = normalizePath(input.fromPath);
  }
  if (input.toPath !== undefined) {
    payload.to_path = normalizePath(input.toPath);
  }
  if (input.code !== undefined) {
    payload.code = input.code;
  }
  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }
  if (input.source !== undefined) {
    payload.source = input.source;
  }
  if (input.sourceMetadata !== undefined) {
    payload.source_metadata = input.sourceMetadata;
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one redirect field must be updated");
  }

  const nextFromPath =
    (payload.from_path as string | undefined) ?? existing.from_path;
  const nextToPath =
    (payload.to_path as string | undefined) ?? existing.to_path;
  const nextIsActive =
    (payload.is_active as boolean | undefined) ?? existing.is_active;

  if (nextFromPath === nextToPath) {
    throw new ApiError(400, "Redirect source and target cannot be identical");
  }

  if (
    nextIsActive &&
    (await hasRedirectCycle({
      fromPath: nextFromPath,
      toPath: nextToPath,
      ignoreId: input.id,
    }))
  ) {
    throw new ApiError(409, "Redirect would create a cycle");
  }

  const { data, error } = await supabase
    .from("route_redirects")
    .update(payload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError(500, error?.message ?? "Failed to update redirect");
  }

  return data as RouteRedirectRow;
}

export async function getPublicRouteInventory(
  locale: SeoLocale = DEFAULT_SEO_LOCALE,
): Promise<PublicInventoryEntry[]> {
  const supabase = asSupabase();

  const [
    cmsPagesRes,
    blogCategoriesRes,
    blogPostsRes,
    blogTagsRes,
    blogAuthorsRes,
    treatmentsRes,
    doctorsRes,
    providersRes,
    patientStoriesRes,
    overridesRes,
  ] = await Promise.all([
    supabase
      .from("cms_pages")
      .select("slug, title, seo, updated_at")
      .eq("status", "published"),
    supabase
      .from("blog_categories")
      .select("slug, name, description, updated_at"),
    supabase
      .from("blog_posts")
      .select(
        "slug, title, excerpt, seo_title, seo_description, og_image, featured_image, updated_at, publish_date, category:blog_categories(slug, name)",
      )
      .eq("status", "published")
      .or(`publish_date.is.null,publish_date.lte.${nowIso()}`),
    supabase.from("blog_tags").select("slug, name"),
    supabase.from("blog_authors").select("slug, name, bio, active, updated_at"),
    supabase
      .from("treatments")
      .select("slug, name, summary, card_image_url, hero_image_url, updated_at")
      .eq("is_active", true)
      .eq("is_listed_public", true),
    supabase
      .from("doctors")
      .select("id, name, specialization, bio, avatar_url, updated_at")
      .eq("is_active", true),
    supabase
      .from("service_providers")
      .select(
        "slug, name, overview, description, logo_url, updated_at, is_partner",
      )
      .or("is_partner.is.null,is_partner.eq.true"),
    supabase
      .from("patient_stories")
      .select(
        "patient_id, headline, excerpt, hero_image, published, updated_at",
      )
      .eq("published", true)
      .not("patient_id", "is", null)
      .order("updated_at", { ascending: false })
      .order("patient_id", { ascending: true }),
    supabase
      .from("seo_overrides")
      .select(
        "route_key, locale, title, description, og_image_url, robots_index",
      )
      .in("locale", [locale, DEFAULT_SEO_LOCALE]),
  ]);

  const sourceErrors = [
    ["cms_pages", cmsPagesRes.error],
    ["blog_categories", blogCategoriesRes.error],
    ["blog_posts", blogPostsRes.error],
    ["blog_tags", blogTagsRes.error],
    ["blog_authors", blogAuthorsRes.error],
    ["treatments", treatmentsRes.error],
    ["doctors", doctorsRes.error],
    ["service_providers", providersRes.error],
    ["patient_stories", patientStoriesRes.error],
    ["seo_overrides", overridesRes.error],
  ].filter(([, error]) => Boolean(error));

  if (sourceErrors.length > 0) {
    const details = sourceErrors
      .map(
        ([source, error]) =>
          `${source}: ${String((error as { message?: string })?.message ?? "Unknown error")}`,
      )
      .join("; ");
    throw new ApiError(500, `Failed to build SEO inventory: ${details}`);
  }

  const overrideRows = (overridesRes.data ?? []) as InventoryOverrideRow[];
  const overrideLookup = buildOverrideLookup(overrideRows, locale);
  const localeOverrideLookup = buildExactLocaleOverrideLookup(
    overrideRows,
    locale,
  );

  const entries: PublicInventoryEntry[] = [];
  const cmsPages = (cmsPagesRes.data ?? []) as Array<{
    slug: string;
    title: string;
    seo?: Record<string, unknown> | null;
    updated_at?: string | null;
  }>;

  const cmsPageByPath = new Map<
    string,
    {
      title: string;
      seo?: Record<string, unknown> | null;
      updated_at?: string | null;
    }
  >();
  for (const page of cmsPages) {
    const pathname = normalizePath(
      page.slug === "home" ? "/" : `/${page.slug}`,
    );
    cmsPageByPath.set(pathname, page);
  }

  for (const route of STATIC_PUBLIC_ROUTE_DEFAULTS) {
    const pathname = normalizePath(route.pathname);
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);
    const cmsPage = cmsPageByPath.get(pathname);
    const cmsSeo = (cmsPage?.seo ?? null) as Record<string, unknown> | null;

    const sourceTitle =
      readCmsSeoField(cmsSeo, "title") ??
      (cmsPage?.title ? `${cmsPage.title} | Care N Tour` : route.title);
    const sourceDescription =
      readCmsSeoField(cmsSeo, "description") ?? route.description;
    const sourceImage = readCmsSeoField(cmsSeo, "ogImage");

    const title = effectiveOverride?.title ?? sourceTitle;
    const description = effectiveOverride?.description ?? sourceDescription;
    const image = effectiveOverride?.og_image_url ?? sourceImage;

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "static",
      label: route.title,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: cmsPage?.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(title),
        hasDescription: Boolean(description),
        hasImage: Boolean(image),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const staticPaths = new Set(
    STATIC_PUBLIC_ROUTE_DEFAULTS.map((entry) => normalizePath(entry.pathname)),
  );

  for (const page of cmsPages) {
    const pathname = normalizePath(
      page.slug === "home" ? "/" : `/${page.slug}`,
    );
    if (staticPaths.has(pathname)) {
      continue;
    }

    const sourceTitle =
      readCmsSeoField(page.seo as Record<string, unknown> | null, "title") ??
      `${page.title} | Care N Tour`;
    const sourceDescription = readCmsSeoField(
      page.seo as Record<string, unknown> | null,
      "description",
    );
    const sourceImage = readCmsSeoField(
      page.seo as Record<string, unknown> | null,
      "ogImage",
    );

    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "cms-page",
      label: page.title,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: page.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const blogCategories = (blogCategoriesRes.data ?? []) as Array<{
    slug: string;
    name: string;
    description?: string | null;
    updated_at?: string | null;
  }>;

  for (const category of blogCategories) {
    const pathname = normalizePath(`/blog/${category.slug}`);
    const sourceTitle = `${category.name} Articles | Care N Tour Blog`;
    const sourceDescription = category.description ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "blog-category",
      label: `Blog Category: ${category.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      updatedAt: category.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const blogPosts = (blogPostsRes.data ?? []) as Array<{
    slug: string;
    title: string;
    excerpt?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    og_image?: string | null;
    featured_image?: string | null;
    updated_at?: string | null;
    category?: { slug?: string; name?: string } | null;
  }>;

  for (const post of blogPosts) {
    const categorySlug = post.category?.slug;
    if (!categorySlug) {
      continue;
    }

    const pathname = normalizePath(`/blog/${categorySlug}/${post.slug}`);
    const sourceTitle = post.seo_title ?? post.title;
    const sourceDescription = post.seo_description ?? post.excerpt ?? null;
    const sourceImage = post.og_image ?? post.featured_image ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "blog-post",
      label: `Blog Post: ${post.title}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: post.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const blogTags = (blogTagsRes.data ?? []) as Array<{
    slug: string;
    name: string;
    updated_at?: string | null;
  }>;

  for (const tag of blogTags) {
    const pathname = normalizePath(`/blog/tag/${tag.slug}`);
    const sourceTitle = `#${tag.name} Articles | Care N Tour Blog`;
    const sourceDescription = `Explore blog posts tagged with ${tag.name}.`;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "blog-tag",
      label: `Blog Tag: ${tag.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      updatedAt: tag.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const blogAuthors = (blogAuthorsRes.data ?? []) as Array<{
    slug: string;
    name: string;
    bio?: string | null;
    active?: boolean | null;
    updated_at?: string | null;
  }>;

  for (const author of blogAuthors.filter((row) => row.active !== false)) {
    const pathname = normalizePath(`/blog/author/${author.slug}`);
    const sourceTitle = `${author.name} | Care N Tour Blog`;
    const sourceDescription =
      author.bio ?? `Articles written by ${author.name}.`;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "blog-author",
      label: `Blog Author: ${author.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      updatedAt: author.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const treatments = (treatmentsRes.data ?? []) as Array<{
    slug: string;
    name: string;
    summary?: string | null;
    hero_image_url?: string | null;
    card_image_url?: string | null;
    updated_at?: string | null;
  }>;

  for (const treatment of treatments) {
    const pathname = normalizePath(`/treatments/${treatment.slug}`);
    const sourceTitle = `${treatment.name} | Treatments | Care N Tour`;
    const sourceDescription = treatment.summary ?? null;
    const sourceImage =
      treatment.hero_image_url ?? treatment.card_image_url ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "treatment",
      label: `Treatment: ${treatment.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: treatment.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const doctors = (doctorsRes.data ?? []) as Array<{
    id: string;
    name: string;
    specialization?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    updated_at?: string | null;
  }>;

  for (const doctor of doctors) {
    const pathname = normalizePath(`/doctors/${doctor.id}`);
    const sourceTitle = `${doctor.name} | Doctors | Care N Tour`;
    const sourceDescription =
      doctor.bio ??
      (doctor.specialization
        ? `${doctor.specialization} specialist at Care N Tour`
        : null);
    const sourceImage = doctor.avatar_url ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "doctor",
      label: `Doctor: ${doctor.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: doctor.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const providers = (providersRes.data ?? []) as Array<{
    slug: string;
    name: string;
    overview?: string | null;
    description?: string | null;
    logo_url?: string | null;
    updated_at?: string | null;
  }>;

  for (const provider of providers) {
    const pathname = normalizePath(`/medical-facilities/${provider.slug}`);
    const sourceTitle = `${provider.name} | Medical Facilities | Care N Tour`;
    const sourceDescription = provider.overview ?? provider.description ?? null;
    const sourceImage = provider.logo_url ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "medical-facility",
      label: `Medical Facility: ${provider.name}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: provider.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  const patientStories = (patientStoriesRes.data ?? []) as Array<{
    patient_id: string;
    headline?: string | null;
    excerpt?: string | null;
    hero_image?: string | null;
    updated_at?: string | null;
  }>;

  const seenPatient = new Set<string>();
  for (const story of patientStories) {
    if (!story.patient_id || seenPatient.has(story.patient_id)) {
      continue;
    }

    seenPatient.add(story.patient_id);

    const pathname = normalizePath(`/patients/${story.patient_id}`);
    const sourceTitle = story.headline
      ? `${story.headline} | Patient Story | Care N Tour`
      : "Patient Story | Care N Tour";
    const sourceDescription = story.excerpt ?? null;
    const sourceImage = story.hero_image ?? null;
    const effectiveOverride = overrideLookup.get(pathname);
    const scoringOverride =
      locale === DEFAULT_SEO_LOCALE
        ? effectiveOverride
        : localeOverrideLookup.get(pathname);

    entries.push({
      routeKey: pathname,
      pathname,
      sourceType: "patient-story",
      label: `Patient Story: ${story.patient_id}`,
      indexable: effectiveOverride?.robots_index ?? true,
      locale,
      sourceTitle,
      sourceDescription,
      sourceOgImage: sourceImage,
      updatedAt: story.updated_at,
      needsSeoScore: computeNeedsSeoScore({
        hasTitle: Boolean(scoringOverride?.title ?? sourceTitle),
        hasDescription: Boolean(
          scoringOverride?.description ?? sourceDescription,
        ),
        hasImage: Boolean(scoringOverride?.og_image_url ?? sourceImage),
        hasOverride: Boolean(scoringOverride),
      }),
    });
  }

  return entries.sort((a, b) => a.pathname.localeCompare(b.pathname));
}
