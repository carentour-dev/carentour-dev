import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  extractBlogAiSummary,
  resolveBlogPageBlocks,
} from "@/lib/blog/page-helpers";
import { getLocalizedBlogCategoryBySlug } from "@/lib/blog/server";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  assertPublicPageAvailable,
  decodePublicRouteSegment,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

async function getSeo(categorySlug: string, locale: "en" | "ar") {
  const category = await getLocalizedBlogCategoryBySlug({
    slug: categorySlug,
    locale,
    publishedOnly: true,
  });
  const templatePage = await getLocalizedCmsPageBySlug(
    "blog-category-template",
    locale,
  );
  const blocks = resolveBlogPageBlocks(templatePage);
  const pathname =
    category?.path ??
    getLocalizedPublicPagePathname(`/blog/${categorySlug}`, locale);
  const title = category
    ? locale === "ar"
      ? `مقالات ${category.name} | مدونة كير آند تور`
      : `${category.name} Articles | Care N Tour Blog`
    : locale === "ar"
      ? "تصنيف المدونة | كير آند تور"
      : "Blog Category | Care N Tour";
  const description =
    category?.description ??
    (locale === "ar"
      ? "تصفح المقالات ضمن هذا التصنيف."
      : "Browse articles in this category.");

  return {
    category,
    blocks,
    seo: await resolveSeo({
      routeKey: "/blog/[category]",
      pathname,
      locale,
      defaults: {
        title,
        description,
      },
      source: {
        title,
        description,
        aiSummary: extractBlogAiSummary(blocks, [
          category?.name,
          category?.description,
        ]),
      },
      schema: collectionPageSchema({
        urlPath: pathname,
        title,
        description,
        items: category ? [{ name: category.name, path: pathname }] : undefined,
      }),
      indexable: Boolean(category),
      modifiedTime: category?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = decodePublicRouteSegment(rawCategory);
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/${category}`, locale);
  const { seo } = await getSeo(category, locale);
  return seo.metadata;
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: rawCategory } = await params;
  const category = decodePublicRouteSegment(rawCategory);
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/${category}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const {
    category: categoryRecord,
    blocks,
    seo,
  } = await getSeo(category, locale);

  if (!categoryRecord || blocks.length === 0) {
    notFound();
  }

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        locale={locale}
        context={{
          blog: {
            type: "category",
            pagePath: categoryRecord.path,
            category: categoryRecord,
          },
        }}
      />
    </>
  );
}
