import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import BlogTagPageClient from "./BlogTagPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function getTag(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_tags")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog tag for SEO", { slug, error });
    return null;
  }

  return data;
}

async function getSeo(slug: string, locale: PublicLocale) {
  const pathname = `/blog/tag/${slug}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const tag = await getTag(slug);

  const defaultTitle = tag
    ? `#${tag.name} Articles | Care N Tour Blog`
    : "Blog Tag | Care N Tour";
  const defaultDescription = tag
    ? `Explore blog posts tagged with ${tag.name}.`
    : "Browse tagged articles.";

  return resolveSeo({
    routeKey: pathname,
    pathname: localizedPathname,
    locale,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: tag
      ? {
          title: defaultTitle,
          description: defaultDescription,
        }
      : undefined,
    schema: collectionPageSchema({
      urlPath: localizedPathname,
      title: defaultTitle,
      description: defaultDescription,
      items: tag ? [{ name: tag.name, path: localizedPathname }] : undefined,
    }),
    indexable: Boolean(tag),
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/tag/${slug}`, locale);
  const seo = await getSeo(slug, locale);
  return seo.metadata;
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/tag/${slug}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(slug, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogTagPageClient />
    </>
  );
}
