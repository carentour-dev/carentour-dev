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
import BlogCategoryPageClient from "./BlogCategoryPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

async function getCategory(categorySlug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("slug, name, description, updated_at")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog category for SEO", {
      categorySlug,
      error,
    });
    return null;
  }

  return data;
}

async function getSeo(categorySlug: string, locale: PublicLocale) {
  const pathname = `/blog/${categorySlug}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const category = await getCategory(categorySlug);
  const defaultTitle = category
    ? `${category.name} Articles | Care N Tour Blog`
    : "Blog Category | Care N Tour";
  const defaultDescription =
    category?.description ?? "Browse articles in this category.";

  return resolveSeo({
    routeKey: pathname,
    pathname: localizedPathname,
    locale,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: category
      ? {
          title: defaultTitle,
          description: defaultDescription,
        }
      : undefined,
    schema: collectionPageSchema({
      urlPath: localizedPathname,
      title: defaultTitle,
      description: defaultDescription,
      items: category
        ? [{ name: `${category.name} Articles`, path: localizedPathname }]
        : undefined,
    }),
    indexable: Boolean(category),
    modifiedTime: category?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/${category}`, locale);
  const seo = await getSeo(category, locale);
  return seo.metadata;
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/${category}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(category, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogCategoryPageClient />
    </>
  );
}
