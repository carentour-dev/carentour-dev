import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  extractBlogAiSummary,
  resolveBlogPageBlocks,
} from "@/lib/blog/page-helpers";
import { getLocalizedBlogTagBySlug } from "@/lib/blog/server";
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
  params: Promise<{ locale: string; slug: string }>;
};

async function getSeo(slug: string, locale: "en" | "ar") {
  const tag = await getLocalizedBlogTagBySlug({
    slug,
    locale,
    publishedOnly: true,
  });
  const templatePage = await getLocalizedCmsPageBySlug(
    "blog-tag-template",
    locale,
  );
  const blocks = resolveBlogPageBlocks(templatePage);
  const pathname =
    tag?.path ?? getLocalizedPublicPagePathname(`/blog/tag/${slug}`, locale);
  const title = tag
    ? locale === "ar"
      ? `مقالات الوسم ${tag.name} | مدونة كير آند تور`
      : `#${tag.name} Articles | Care N Tour Blog`
    : locale === "ar"
      ? "وسم المدونة | كير آند تور"
      : "Blog Tag | Care N Tour";
  const description =
    tag?.description ??
    (tag
      ? locale === "ar"
        ? `استكشف المقالات المرتبطة بالوسم ${tag.name}.`
        : `Explore blog posts tagged with ${tag.name}.`
      : locale === "ar"
        ? "تصفح المقالات المرتبطة بالوسوم."
        : "Browse tagged articles.");

  return {
    tag,
    blocks,
    seo: await resolveSeo({
      routeKey: "/blog/tag/[slug]",
      pathname,
      locale,
      defaults: {
        title,
        description,
      },
      source: {
        title,
        description,
        aiSummary: extractBlogAiSummary(blocks, [tag?.name, tag?.description]),
      },
      schema: collectionPageSchema({
        urlPath: pathname,
        title,
        description,
        items: tag ? [{ name: tag.name, path: pathname }] : undefined,
      }),
      indexable: Boolean(tag),
      modifiedTime: tag?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/tag/${slug}`, locale);
  const { seo } = await getSeo(slug, locale);
  return seo.metadata;
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/tag/${slug}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const { tag, blocks, seo } = await getSeo(slug, locale);
  if (!tag || blocks.length === 0) {
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
            type: "tag",
            pagePath: tag.path,
            tag,
          },
        }}
      />
    </>
  );
}
