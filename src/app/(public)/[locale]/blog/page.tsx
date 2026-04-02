import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  extractBlogAiSummary,
  resolveBlogPageBlocks,
} from "@/lib/blog/page-helpers";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  websiteSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/blog";

type PageProps = {
  params: Promise<{ locale: string }>;
};

async function getSeo(locale: "en" | "ar") {
  const cmsPage = await getLocalizedCmsPageBySlug("blog", locale);
  const blocks = resolveBlogPageBlocks(cmsPage);
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : "Health Insights & Travel Guides | Care N Tour Blog";
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : "Read Care N Tour guidance on medical travel planning, treatment preparation, recovery, and patient decision-making.";
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return {
    cmsPage,
    blocks,
    seo: await resolveSeo({
      routeKey: PATHNAME,
      pathname: localizedPathname,
      locale,
      defaults: {
        title,
        description,
      },
      source: {
        title,
        description,
        ogImageUrl: ogImage,
        aiSummary: extractBlogAiSummary(blocks, [description]),
      },
      schema: [
        organizationSchema(),
        websiteSchema(),
        collectionPageSchema({
          urlPath: localizedPathname,
          title,
          description,
        }),
      ],
      modifiedTime: cmsPage?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  const { seo } = await getSeo(locale);
  return seo.metadata;
}

export default async function BlogPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const { cmsPage, blocks, seo } = await getSeo(locale);

  if (!cmsPage || blocks.length === 0) {
    notFound();
  }

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        locale={locale}
        context={{ blog: { type: "landing", pagePath: PATHNAME } }}
      />
    </>
  );
}
