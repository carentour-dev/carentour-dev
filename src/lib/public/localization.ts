import { notFound } from "next/navigation";
import type { CmsPage } from "@/lib/cms/server";
import {
  BLOG_AUTHOR_TEMPLATE_SLUG,
  BLOG_CATEGORY_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_TAG_TEMPLATE_SLUG,
  getLocalizedBlogAuthorBySlug,
  getLocalizedBlogCategoryBySlug,
  getLocalizedBlogPostByPath,
  getLocalizedBlogTagBySlug,
  getLocalizedBlogTemplatePage,
  resolveLocalizedBlogSwitchPath,
} from "@/lib/blog/server";
import { normalizeBlocks } from "@/lib/cms/blocks";
import {
  sanitizeCmsPageSettings,
  type CmsPageSettings,
} from "@/lib/cms/pageSettings";
import type { NavigationLink, NavigationQueryResult } from "@/lib/navigation";
import {
  buildPublicNavigationLinks,
  getFallbackNavigationLinks,
} from "@/lib/navigation";
import {
  getDefaultCategories,
  sortFaqs,
  type FaqCategory,
  type FaqEntry,
  type FaqStatus,
} from "@/lib/faq/data";
import {
  isPublicArabicEnabled,
  isPublicLocale,
  localizePublicPathname,
  PUBLIC_ARABIC_UNSUPPORTED_PREFIXES,
  stripPublicLocalePrefix,
} from "@/lib/public/routing";
import {
  localizeCompanyName,
  localizeCompanyNameDeep,
} from "@/lib/public/brand";
import { isInternalNoindexPath, normalizePath } from "@/lib/seo/utils";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import {
  defaultPublicLocale,
  publicLocales,
  type PublicLocale,
} from "@/i18n/routing";

type CmsPageRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seo: Record<string, unknown> | null;
  settings: CmsPageSettings;
  content: unknown;
  updated_at: string | null;
};

type CmsPageTranslationRow = {
  cms_page_id: string;
  locale: PublicLocale;
  title: string | null;
  seo: Record<string, unknown> | null;
  content: unknown;
  status: "draft" | "published";
  updated_at: string | null;
};

type NavigationTranslationRow = {
  navigation_link_id: string;
  locale: PublicLocale;
  label: string | null;
  status: "draft" | "published" | "hidden";
  updated_at: string | null;
};

type FaqTranslationRow = {
  faq_id: string;
  locale: PublicLocale;
  question: string | null;
  answer: string | null;
  status: "draft" | "published";
  updated_at: string | null;
};

type FaqCategoryTranslationRow = {
  faq_category_slug: string;
  locale: PublicLocale;
  title: string | null;
  description: string | null;
  status: "draft" | "published";
  updated_at: string | null;
};

type LocalizedFaqResult = {
  faqs: FaqEntry[];
  categories: FaqCategory[];
  source: "cms" | "fallback" | "unavailable";
  error?: string;
};

const CMS_BACKED_STATIC_SLUGS = new Set([
  "home",
  "about",
  "contact",
  "plan",
  "travel-info",
  "concierge",
]);

const CMS_PAGE_COLUMNS =
  "id, slug, title, status, seo, settings, content, updated_at";

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

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function validatePublicLocale(
  locale: string,
): asserts locale is PublicLocale {
  if (!isPublicLocale(locale)) {
    notFound();
  }

  if (locale === "ar" && !isPublicArabicEnabled()) {
    notFound();
  }
}

export function normalizePublicPageSlug(slug: string) {
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, "");
  return trimmed || "home";
}

export async function getLocalizedCmsPageBySlug(
  slug: string,
  locale: PublicLocale,
): Promise<CmsPage | null> {
  const normalizedSlug = normalizePublicPageSlug(slug);
  const supabase = asSupabase();

  const { data: page, error } = await supabase
    .from("cms_pages")
    .select(CMS_PAGE_COLUMNS)
    .eq("slug", normalizedSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !page) {
    return null;
  }

  const basePage = page as CmsPageRow;

  if (locale === defaultPublicLocale) {
    return {
      id: basePage.id,
      slug: basePage.slug,
      title: basePage.title,
      status: basePage.status,
      seo: basePage.seo,
      settings: sanitizeCmsPageSettings(basePage.settings),
      content: normalizeBlocks(basePage.content),
      updated_at: basePage.updated_at,
    };
  }

  if (!isPublicArabicEnabled()) {
    return null;
  }

  const { data: translation, error: translationError } = await supabase
    .from("cms_page_translations")
    .select("cms_page_id, locale, title, seo, content, status, updated_at")
    .eq("cms_page_id", basePage.id)
    .eq("locale", locale)
    .eq("status", "published")
    .maybeSingle();

  if (translationError || !translation) {
    return null;
  }

  const localized = translation as CmsPageTranslationRow;

  return {
    id: basePage.id,
    slug: basePage.slug,
    title: localizeCompanyName(
      cleanText(localized.title) ?? basePage.title,
      locale,
    ),
    status: localized.status,
    seo: localizeCompanyNameDeep(localized.seo ?? {}, locale),
    settings: sanitizeCmsPageSettings(basePage.settings),
    content: localizeCompanyNameDeep(
      normalizeBlocks(localized.content),
      locale,
    ),
    updated_at: localized.updated_at ?? basePage.updated_at,
  };
}

export async function getLocalizedFaqs(
  locale: PublicLocale,
): Promise<LocalizedFaqResult> {
  const supabase = asSupabase();

  if (locale === defaultPublicLocale) {
    const [
      { data: faqs, error: faqError },
      { data: categories, error: categoryError },
    ] = await Promise.all([
      supabase
        .from("faqs")
        .select(
          "id, category, question, answer, status, position, created_at, updated_at",
        )
        .eq("status", "published")
        .order("category", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("faq_categories")
        .select(
          "slug, title, description, icon, color, fragment, position, created_at, updated_at",
        )
        .order("position", { ascending: true })
        .order("title", { ascending: true }),
    ]);

    const error = faqError?.message ?? categoryError?.message;

    if ((faqs ?? []).length > 0) {
      return {
        faqs: sortFaqs(
          (faqs ?? []).map((row: any) => ({
            id: row.id,
            category: row.category,
            question: row.question,
            answer: row.answer,
            status: row.status as FaqStatus,
            position: row.position,
            created_at: row.created_at,
            updated_at: row.updated_at,
          })),
        ),
        categories:
          (categories ?? []).map((row: any) => ({
            slug: row.slug,
            title: row.title,
            description: row.description,
            icon: row.icon,
            color: row.color,
            fragment: row.fragment,
            position: row.position,
            created_at: row.created_at,
            updated_at: row.updated_at,
          })) ?? [],
        source: "cms",
        error,
      };
    }

    return {
      faqs: [],
      categories: getDefaultCategories(),
      source: "fallback",
      error,
    };
  }

  if (!isPublicArabicEnabled()) {
    return { faqs: [], categories: [], source: "unavailable" };
  }

  const [
    { data: baseFaqs, error: faqError },
    { data: faqTranslations, error: faqTranslationError },
    { data: baseCategories, error: categoryError },
    { data: categoryTranslations, error: categoryTranslationError },
  ] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, category, position, created_at, updated_at")
      .eq("status", "published")
      .order("category", { ascending: true })
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("faq_translations")
      .select("faq_id, locale, question, answer, status, updated_at")
      .eq("locale", locale)
      .eq("status", "published"),
    supabase
      .from("faq_categories")
      .select("slug, icon, color, fragment, position, created_at, updated_at")
      .order("position", { ascending: true })
      .order("slug", { ascending: true }),
    supabase
      .from("faq_category_translations")
      .select(
        "faq_category_slug, locale, title, description, status, updated_at",
      )
      .eq("locale", locale)
      .eq("status", "published"),
  ]);

  const error =
    faqError?.message ??
    faqTranslationError?.message ??
    categoryError?.message ??
    categoryTranslationError?.message;

  const translationByFaqId = new Map<string, FaqTranslationRow>(
    (faqTranslations ?? []).map((row: any) => [row.faq_id, row]),
  );
  const translationByCategorySlug = new Map<string, FaqCategoryTranslationRow>(
    (categoryTranslations ?? []).map((row: any) => [
      row.faq_category_slug,
      row,
    ]),
  );

  const categories: FaqCategory[] = (baseCategories ?? [])
    .map((row: any) => {
      const translation = translationByCategorySlug.get(row.slug);
      if (!translation) {
        return null;
      }

      return {
        slug: row.slug,
        title: localizeCompanyName(
          cleanText(translation.title) ?? row.slug,
          locale,
        ),
        description: localizeCompanyName(
          cleanText(translation.description),
          locale,
        ),
        icon: row.icon,
        color: row.color,
        fragment: row.fragment,
        position: row.position,
        created_at: row.created_at,
        updated_at: translation.updated_at ?? row.updated_at,
      } satisfies FaqCategory;
    })
    .filter((entry): entry is FaqCategory => Boolean(entry));

  const availableCategories = new Set(categories.map((entry) => entry.slug));
  const faqs: FaqEntry[] = (baseFaqs ?? [])
    .map((row: any) => {
      const translation = translationByFaqId.get(row.id);
      if (!translation || !availableCategories.has(row.category)) {
        return null;
      }

      return {
        id: row.id,
        category: row.category,
        question: localizeCompanyName(
          cleanText(translation.question) ?? "",
          locale,
        ),
        answer: localizeCompanyName(
          cleanText(translation.answer) ?? "",
          locale,
        ),
        status: "published",
        position: row.position,
        created_at: row.created_at,
        updated_at: translation.updated_at ?? row.updated_at,
      } satisfies FaqEntry;
    })
    .filter((entry): entry is FaqEntry =>
      Boolean(entry && entry.question.length > 0 && entry.answer.length > 0),
    );

  if (faqs.length === 0 || categories.length === 0) {
    return {
      faqs: [],
      categories: [],
      source: "unavailable",
      error,
    };
  }

  return {
    faqs: sortFaqs(faqs),
    categories,
    source: "cms",
    error,
  };
}

export async function getPublicLocaleAvailability(
  pathname: string,
  locale: PublicLocale,
): Promise<boolean> {
  const normalized = stripPublicLocalePrefix(pathname);

  if (locale === defaultPublicLocale) {
    return true;
  }

  if (!isPublicArabicEnabled()) {
    return false;
  }

  if (normalized === "/faq") {
    const faqResult = await getLocalizedFaqs(locale);
    return faqResult.source === "cms" && faqResult.faqs.length > 0;
  }

  if (normalized === "/blog") {
    return (await getLocalizedCmsPageBySlug("blog", locale)) !== null;
  }

  if (normalized.startsWith("/blog/tag/")) {
    if (
      (await getLocalizedBlogTemplatePage(BLOG_TAG_TEMPLATE_SLUG, locale)) ===
      null
    ) {
      return false;
    }

    const slug = normalized.slice("/blog/tag/".length);
    return (
      (await getLocalizedBlogTagBySlug({
        slug,
        locale,
        publishedOnly: true,
      })) !== null
    );
  }

  if (normalized.startsWith("/blog/author/")) {
    if (
      (await getLocalizedBlogTemplatePage(
        BLOG_AUTHOR_TEMPLATE_SLUG,
        locale,
      )) === null
    ) {
      return false;
    }

    const slug = normalized.slice("/blog/author/".length);
    return (
      (await getLocalizedBlogAuthorBySlug({
        slug,
        locale,
        publishedOnly: true,
      })) !== null
    );
  }

  if (normalized.startsWith("/blog/")) {
    const segments = normalized
      .split("/")
      .filter(Boolean)
      .map((segment) => decodePathSegment(segment));

    if (segments.length === 2) {
      if (
        (await getLocalizedBlogTemplatePage(
          BLOG_CATEGORY_TEMPLATE_SLUG,
          locale,
        )) === null
      ) {
        return false;
      }

      return (
        (await getLocalizedBlogCategoryBySlug({
          slug: segments[1],
          locale,
          publishedOnly: true,
        })) !== null
      );
    }

    if (segments.length === 3) {
      if (
        (await getLocalizedBlogTemplatePage(
          BLOG_POST_TEMPLATE_SLUG,
          locale,
        )) === null
      ) {
        return false;
      }

      return (
        (await getLocalizedBlogPostByPath({
          categorySlug: segments[1],
          postSlug: segments[2],
          locale,
          publishedOnly: true,
        })) !== null
      );
    }
  }

  if (normalized.startsWith("/medical-facilities/")) {
    return (
      (await getLocalizedCmsPageBySlug(
        "medical-facilities-detail-template",
        locale,
      )) !== null
    );
  }

  if (
    PUBLIC_ARABIC_UNSUPPORTED_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  const slug =
    normalized === "/" ? "home" : normalized.replace(/^\/+/, "").split("/")[0];

  if (CMS_BACKED_STATIC_SLUGS.has(slug) || normalized.split("/").length === 2) {
    return (await getLocalizedCmsPageBySlug(slug, locale)) !== null;
  }

  return false;
}

function localizeNavigationHref(href: string, locale: PublicLocale) {
  if (!href.startsWith("/")) {
    return href;
  }

  if (isInternalNoindexPath(href)) {
    return normalizePath(href);
  }

  return localizePublicPathname(href, locale);
}

export async function resolvePublicLocaleSwitchHref(
  pathname: string,
  targetLocale: PublicLocale,
) {
  const normalized = stripPublicLocalePrefix(pathname);

  if (normalized === "/blog" || normalized.startsWith("/blog/")) {
    const localizedBlogPath = await resolveLocalizedBlogSwitchPath(
      pathname,
      targetLocale,
    );
    if (localizedBlogPath) {
      return localizedBlogPath;
    }
  }

  if (targetLocale === defaultPublicLocale) {
    return normalized;
  }

  const isAvailable = await getPublicLocaleAvailability(
    normalized,
    targetLocale,
  );
  return isAvailable ? localizePublicPathname(normalized, targetLocale) : "/ar";
}

export async function getLocalizedNavigationLinks(
  locale: PublicLocale,
): Promise<NavigationQueryResult> {
  const supabase = asSupabase();

  try {
    const [
      { data: navRows, error: navError },
      { data: cmsPages, error: cmsError },
      translationResult,
    ] = await Promise.all([
      supabase
        .from("navigation_links")
        .select("id,label,href,slug,status,position,kind,cms_page_id")
        .order("position", { ascending: true })
        .order("label", { ascending: true }),
      supabase
        .from("cms_pages")
        .select("id, slug, title, status")
        .eq("status", "published")
        .order("title", { ascending: true }),
      locale === defaultPublicLocale
        ? Promise.resolve({ data: [], error: null })
        : supabase
            .from("navigation_link_translations")
            .select("navigation_link_id, locale, label, status, updated_at")
            .eq("locale", locale),
    ]);

    if (navError) {
      return {
        links: getFallbackNavigationLinks(),
        fallback: true,
        error: navError.message,
      };
    }

    const baseLinks = buildPublicNavigationLinks(navRows ?? [], cmsPages ?? []);

    if (locale === defaultPublicLocale) {
      return {
        links: baseLinks,
        fallback: Boolean(cmsError),
        error: cmsError?.message,
      };
    }

    const translationsByLinkId = new Map<string, NavigationTranslationRow>(
      (translationResult.data ?? []).map((row: any) => [
        row.navigation_link_id,
        row,
      ]),
    );

    const localizedLinks: NavigationLink[] = [];

    for (const link of baseLinks) {
      const translation = translationsByLinkId.get(link.id);
      const isAvailable = await getPublicLocaleAvailability(link.href, locale);

      const resolvedStatus = translation?.status ?? link.status;
      if (resolvedStatus !== "published") {
        continue;
      }
      const localizedHref =
        link.href.startsWith("/") &&
        !isInternalNoindexPath(link.href) &&
        !isAvailable
          ? normalizePath(link.href)
          : localizeNavigationHref(link.href, locale);

      localizedLinks.push({
        ...link,
        label: localizeCompanyName(
          cleanText(translation?.label) ?? link.label,
          locale,
        ),
        status: resolvedStatus,
        href: localizedHref,
      });
    }

    return {
      links: localizedLinks,
      fallback: false,
      error: cmsError?.message ?? translationResult.error?.message ?? undefined,
    };
  } catch (error: any) {
    return {
      links: getFallbackNavigationLinks(),
      fallback: true,
      error: error?.message ?? "Unknown error loading navigation",
    };
  }
}
