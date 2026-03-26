import type { Metadata } from "next";
import type { SUPPORTED_SEO_LOCALES } from "@/lib/seo/constants";

export type SeoLocale = (typeof SUPPORTED_SEO_LOCALES)[number];

export type JsonLdNode = Record<string, unknown>;

export type SeoSourceInput = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  keywords?: string[] | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: string | null;
  aiSummary?: string | null;
  schema?: JsonLdNode | JsonLdNode[] | null;
};

export type SeoResolveInput = {
  routeKey: string;
  pathname: string;
  locale?: SeoLocale;
  defaults: {
    title: string;
    description?: string;
  };
  source?: SeoSourceInput | null;
  imageUrl?: string | null;
  indexable?: boolean;
  follow?: boolean;
  openGraphType?: "website" | "article";
  schema?: JsonLdNode | JsonLdNode[] | null;
  publishedTime?: string;
  modifiedTime?: string;
};

export type SeoOverrideRow = {
  id: string;
  route_key: string;
  locale: SeoLocale;
  title: string | null;
  description: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;
  keywords: string[] | null;
  schema_override: unknown;
  ai_summary: string | null;
  llms_include: boolean;
  llms_priority: number;
  created_at: string;
  updated_at: string;
};

export type RouteRedirectRow = {
  id: string;
  from_path: string;
  to_path: string;
  code: 301 | 302 | 307 | 308;
  is_active: boolean;
  source: string | null;
  source_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ResolvedSeo = {
  routeKey: string;
  pathname: string;
  locale: SeoLocale;
  metadata: Metadata;
  jsonLd: JsonLdNode[];
  noindex: boolean;
  nofollow: boolean;
  canonicalUrl: string;
  aiSummary: string | null;
  llms: {
    include: boolean;
    priority: number;
  };
  override: SeoOverrideRow | null;
};

export type PublicInventoryEntry = {
  routeKey: string;
  pathname: string;
  sourceType:
    | "static"
    | "cms-page"
    | "blog-category"
    | "blog-post"
    | "blog-tag"
    | "blog-author"
    | "treatment"
    | "doctor"
    | "medical-facility"
    | "patient-story";
  label: string;
  indexable: boolean;
  locale: SeoLocale;
  sourceTitle?: string | null;
  sourceDescription?: string | null;
  sourceOgImage?: string | null;
  updatedAt?: string | null;
  needsSeoScore: number;
};
