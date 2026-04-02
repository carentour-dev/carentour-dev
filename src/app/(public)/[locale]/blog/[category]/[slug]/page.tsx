import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  extractBlogAiSummary,
  resolveBlogPageBlocks,
} from "@/lib/blog/page-helpers";
import { getLocalizedBlogPostByPath } from "@/lib/blog/server";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  assertPublicPageAvailable,
  decodePublicRouteSegment,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  blogPostingSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; category: string; slug: string }>;
};

function parseSeoKeywords(keywords: string | null | undefined) {
  return keywords
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function getSeo(categorySlug: string, slug: string, locale: "en" | "ar") {
  const post = await getLocalizedBlogPostByPath({
    categorySlug,
    postSlug: slug,
    locale,
    publishedOnly: true,
  });
  const templatePage = await getLocalizedCmsPageBySlug(
    "blog-post-template",
    locale,
  );
  const blocks = resolveBlogPageBlocks(templatePage);
  const pathname =
    post?.path ??
    getLocalizedPublicPagePathname(`/blog/${categorySlug}/${slug}`, locale);
  const title = post?.seo_title ?? post?.title ?? "Blog Article | Care N Tour";
  const description =
    post?.seo_description ?? post?.excerpt ?? "Read the latest blog article.";

  return {
    post,
    blocks,
    seo: await resolveSeo({
      routeKey: "/blog/[category]/[slug]",
      pathname,
      locale,
      defaults: {
        title,
        description,
      },
      source: post
        ? {
            title,
            description,
            keywords: parseSeoKeywords(post.seo_keywords) ?? null,
            ogImageUrl: post.og_image ?? post.featured_image,
            aiSummary: extractBlogAiSummary(blocks, [
              post.excerpt,
              post.author?.bio,
            ]),
          }
        : undefined,
      schema: post
        ? [
            webPageSchema({
              urlPath: pathname,
              title,
              description,
              breadcrumbs: [
                {
                  name: "Blog",
                  path: getLocalizedPublicPagePathname("/blog", locale),
                },
                ...(post.category
                  ? [{ name: post.category.name, path: post.category.path }]
                  : []),
                { name: post.title, path: pathname },
              ],
            }),
            blogPostingSchema({
              title: post.title,
              description,
              path: pathname,
              imageUrl: post.og_image ?? post.featured_image,
              publishedTime: post.publish_date,
              modifiedTime: post.updated_at,
              authorName: post.author?.name,
              keywords: parseSeoKeywords(post.seo_keywords),
            }),
          ]
        : webPageSchema({
            urlPath: pathname,
            title,
            description,
          }),
      indexable: Boolean(post),
      openGraphType: "article",
      imageUrl: post?.og_image ?? post?.featured_image,
      publishedTime: post?.publish_date ?? undefined,
      modifiedTime: post?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: rawCategory, slug: rawSlug } = await params;
  const category = decodePublicRouteSegment(rawCategory);
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/blog/${category}/${slug}`, locale);
  const { seo } = await getSeo(category, slug, locale);
  return seo.metadata;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { category: rawCategory, slug: rawSlug } = await params;
  const category = decodePublicRouteSegment(rawCategory);
  const slug = decodePublicRouteSegment(rawSlug);
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/blog/${category}/${slug}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const post = await getLocalizedBlogPostByPath({
    categorySlug: category,
    postSlug: slug,
    locale,
    publishedOnly: true,
    incrementViewCount: true,
  });
  if (!post) {
    notFound();
  }

  const templatePage = await getLocalizedCmsPageBySlug(
    "blog-post-template",
    locale,
  );
  const blocks = resolveBlogPageBlocks(templatePage);
  if (blocks.length === 0) {
    notFound();
  }
  const { seo } = await getSeo(category, slug, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        locale={locale}
        context={{
          blog: {
            type: "post",
            pagePath: post.path ?? pathname,
            post,
          },
        }}
      />
    </>
  );
}
