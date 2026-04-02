import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { BLOG_INTERNAL_TEMPLATE_SLUGS } from "@/lib/blog/server";
import type { PublicLocale } from "@/i18n/routing";
import { type CmsPage } from "@/lib/cms/server";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const INTERNAL_CMS_TEMPLATE_SLUGS = new Set([
  "medical-facilities-detail-template",
  ...BLOG_INTERNAL_TEMPLATE_SLUGS,
]);

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function getSeo(
  pathname: string,
  cmsPage: CmsPage | null,
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const companyName = getLocalizedCompanyName(locale);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : cmsPage?.title
        ? `${cmsPage.title} | ${companyName}`
        : companyName;

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : undefined;

  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return resolveSeo({
    routeKey: pathname,
    pathname: localizedPathname,
    locale,
    defaults: {
      title,
      description,
    },
    source: cmsPage
      ? {
          title,
          description,
          ogImageUrl: ogImage,
        }
      : undefined,
    schema: webPageSchema({
      urlPath: localizedPathname,
      title,
      description,
    }),
    indexable: Boolean(cmsPage),
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/${slug}`;
  const cmsPage = await getLocalizedCmsPageBySlug(slug, locale);
  const seo = await getSeo(pathname, cmsPage, locale);
  return seo.metadata;
}

export default async function GenericCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);

  if (INTERNAL_CMS_TEMPLATE_SLUGS.has(slug)) {
    return notFound();
  }

  const cmsPage = await getLocalizedCmsPageBySlug(slug, locale);

  if (!cmsPage || !cmsPage.content?.length) {
    return notFound();
  }

  const seo = await getSeo(pathname, cmsPage, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={cmsPage.content} locale={locale} />
    </>
  );
}
