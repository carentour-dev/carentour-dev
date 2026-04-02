import type { Metadata } from "next";
import {
  CANONICAL_ORIGIN,
  DEFAULT_SEO_LOCALE,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo/constants";
import { resolvePublicLocaleSwitchHref } from "@/lib/public/localization";
import { stripPublicLocalePrefix } from "@/lib/public/routing";
import {
  getLocalizedCompanyName,
  localizeCompanyName,
  localizeCompanyNameDeep,
} from "@/lib/public/brand";
import { fetchSeoOverrideForRoute } from "@/lib/seo/data";
import {
  asJsonLdArray,
  buildOgFallbackImageUrl,
  isInternalNoindexPath,
  parseKeywords,
  toAbsoluteUrl,
  toCanonicalUrl,
} from "@/lib/seo/utils";
import type { ResolvedSeo, SeoResolveInput } from "@/lib/seo/types";

const cleanText = (value: string | null | undefined) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const trimOrNull = (value: string | null | undefined) => {
  const trimmed = cleanText(value);
  return trimmed ?? null;
};

const buildCanonical = (input: {
  pathname: string;
  overrideCanonicalUrl?: string | null;
  sourceCanonicalUrl?: string | null;
}) => {
  const candidate =
    cleanText(input.overrideCanonicalUrl) ??
    cleanText(input.sourceCanonicalUrl) ??
    null;

  if (candidate) {
    return toCanonicalUrl(candidate);
  }

  return toCanonicalUrl(input.pathname);
};

const resolveSchemaPayload = (input: {
  generated: SeoResolveInput["schema"];
  source: SeoResolveInput["source"];
  override: unknown;
}) => {
  const overrideSchema = asJsonLdArray(input.override as any);
  if (overrideSchema.length > 0) {
    return overrideSchema;
  }

  const sourceSchema = asJsonLdArray(input.source?.schema ?? null);
  const generatedSchema = asJsonLdArray(input.generated ?? null);
  const merged = [...generatedSchema, ...sourceSchema];

  return merged.length > 0 ? merged : [];
};

const resolveLocaleAlternates = async (pathname: string) => {
  const englishPath = await resolvePublicLocaleSwitchHref(pathname, "en");
  const englishUrl = `${CANONICAL_ORIGIN}${englishPath}`;
  const languages: Record<string, string> = {
    en: englishUrl,
    "x-default": englishUrl,
  };

  const arabicPath = await resolvePublicLocaleSwitchHref(pathname, "ar");
  if (
    stripPublicLocalePrefix(pathname) === "/" ||
    stripPublicLocalePrefix(arabicPath) !== "/"
  ) {
    languages.ar = `${CANONICAL_ORIGIN}${arabicPath}`;
  }

  return languages;
};

export async function resolveSeo(input: SeoResolveInput): Promise<ResolvedSeo> {
  const locale = input.locale ?? DEFAULT_SEO_LOCALE;
  const override = await fetchSeoOverrideForRoute({
    routeKey: input.routeKey,
    pathname: input.pathname,
    locale,
  });

  const isInternal = isInternalNoindexPath(input.pathname);
  const robotsIndex =
    isInternal || input.indexable === false
      ? false
      : (override?.robots_index ?? true);
  const robotsFollow =
    isInternal || input.follow === false
      ? false
      : (override?.robots_follow ?? true);

  const title = localizeCompanyName(
    cleanText(override?.title) ??
      cleanText(input.source?.title) ??
      cleanText(input.defaults.title) ??
      "Care N Tour",
    locale,
  );

  const description = localizeCompanyName(
    cleanText(override?.description) ??
      cleanText(input.source?.description) ??
      cleanText(input.defaults.description) ??
      undefined,
    locale,
  );

  const keywords =
    parseKeywords(override?.keywords) ?? parseKeywords(input.source?.keywords);

  const canonicalUrl = buildCanonical({
    pathname: input.pathname,
    overrideCanonicalUrl: override?.canonical_url,
    sourceCanonicalUrl: input.source?.canonicalUrl,
  });
  const canonicalPathname = (() => {
    try {
      return new URL(canonicalUrl).pathname;
    } catch {
      return input.pathname;
    }
  })();

  const fallbackImage = buildOgFallbackImageUrl(input.pathname, title);

  const ogImage =
    cleanText(override?.og_image_url) ??
    cleanText(input.source?.ogImageUrl) ??
    cleanText(input.imageUrl) ??
    fallbackImage ??
    DEFAULT_OG_IMAGE;

  const twitterImage =
    cleanText(override?.twitter_image_url) ??
    cleanText(input.source?.twitterImageUrl) ??
    ogImage;

  const openGraphTitle = localizeCompanyName(
    cleanText(override?.og_title) ?? cleanText(input.source?.ogTitle) ?? title,
    locale,
  );

  const openGraphDescription = localizeCompanyName(
    cleanText(override?.og_description) ??
      cleanText(input.source?.ogDescription) ??
      description,
    locale,
  );

  const twitterTitle = localizeCompanyName(
    cleanText(override?.twitter_title) ??
      cleanText(input.source?.twitterTitle) ??
      openGraphTitle,
    locale,
  );

  const twitterDescription = localizeCompanyName(
    cleanText(override?.twitter_description) ??
      cleanText(input.source?.twitterDescription) ??
      openGraphDescription,
    locale,
  );

  const jsonLd = localizeCompanyNameDeep(
    resolveSchemaPayload({
      generated: input.schema,
      source: input.source,
      override: override?.schema_override,
    }),
    locale,
  );

  const aiSummary = localizeCompanyName(
    trimOrNull(override?.ai_summary) ??
      trimOrNull(input.source?.aiSummary) ??
      trimOrNull(description),
    locale,
  );

  const metadata: Metadata = {
    metadataBase: new URL(CANONICAL_ORIGIN),
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: await resolveLocaleAlternates(canonicalPathname),
    },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: {
        index: robotsIndex,
        follow: robotsFollow,
      },
    },
    openGraph: {
      type: input.openGraphType ?? "website",
      title: openGraphTitle,
      description: openGraphDescription,
      siteName: getLocalizedCompanyName(locale),
      url: canonicalUrl,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      images: ogImage
        ? [
            {
              url: toAbsoluteUrl(ogImage),
              alt: openGraphTitle,
            },
          ]
        : undefined,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [toAbsoluteUrl(twitterImage)] : undefined,
    },
    other: {
      "ai:summary": aiSummary ?? undefined,
    },
  };

  return {
    routeKey: input.routeKey,
    pathname: input.pathname,
    locale,
    metadata,
    jsonLd,
    noindex: !robotsIndex,
    nofollow: !robotsFollow,
    canonicalUrl,
    aiSummary,
    llms: {
      include: override?.llms_include ?? true,
      priority: override?.llms_priority ?? 0,
    },
    override,
  };
}
