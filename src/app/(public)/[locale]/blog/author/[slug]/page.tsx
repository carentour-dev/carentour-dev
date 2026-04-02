import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  extractBlogAiSummary,
  resolveBlogPageBlocks,
} from "@/lib/blog/page-helpers";
import { getLocalizedBlogAuthorBySlug } from "@/lib/blog/server";
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
  const author = await getLocalizedBlogAuthorBySlug({
    slug,
    locale,
    publishedOnly: true,
  });
  const templatePage = await getLocalizedCmsPageBySlug(
    "blog-author-template",
    locale,
  );
  const blocks = resolveBlogPageBlocks(templatePage);
  const pathname =
    author?.path ??
    getLocalizedPublicPagePathname(`/blog/author/${slug}`, locale);
  const title = author
    ? locale === "ar"
      ? `مقالات ${author.name} | مدونة كير آند تور`
      : `${author.name} | Care N Tour Blog`
    : locale === "ar"
      ? "كاتب المدونة | كير آند تور"
      : "Blog Author | Care N Tour";
  const description =
    author?.bio ??
    (author
      ? locale === "ar"
        ? `مقالات كتبها ${author.name}.`
        : `Articles written by ${author.name}.`
      : locale === "ar"
        ? "تصفح مقالات الكتّاب."
        : "Browse author articles.");

  return {
    author,
    blocks,
    seo: await resolveSeo({
      routeKey: "/blog/author/[slug]",
      pathname,
      locale,
      defaults: {
        title,
        description,
      },
      source: {
        title,
        description,
        ogImageUrl: author?.avatar ?? undefined,
        aiSummary: extractBlogAiSummary(blocks, [author?.name, author?.bio]),
      },
      schema: collectionPageSchema({
        urlPath: pathname,
        title,
        description,
        items: author ? [{ name: author.name, path: pathname }] : undefined,
      }),
      indexable: Boolean(author),
      imageUrl: author?.avatar ?? undefined,
      modifiedTime: author?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/author/${slug}`, locale);
  const { seo } = await getSeo(slug, locale);
  return seo.metadata;
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/author/${slug}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const { author, blocks, seo } = await getSeo(slug, locale);
  if (!author || blocks.length === 0) {
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
            type: "author",
            pagePath: author.path,
            author,
          },
        }}
      />
    </>
  );
}
