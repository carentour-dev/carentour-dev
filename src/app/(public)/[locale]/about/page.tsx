import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import { type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/about";
const fallbackTemplate = getTemplate("about-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

async function getSeo(cmsPage: CmsPage | null, locale: PublicLocale) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const aboutLabel = locale === "ar" ? "من نحن" : "About Us";
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        `About ${companyName} | Medical Tourism Experts in Egypt`);

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        `Learn how ${companyName} guides international patients to trusted treatment providers in Egypt with verified partners, coordinated planning, and personal support.`);

  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return resolveSeo({
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
    },
    schema: [
      webPageSchema({
        urlPath: localizedPathname,
        title,
        description,
        breadcrumbs: [
          {
            name: homeLabel,
            path: getLocalizedPublicPagePathname("/", locale),
          },
          { name: aboutLabel, path: localizedPathname },
        ],
      }),
      organizationSchema(),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const cmsPage = await getLocalizedCmsPageBySlug("about", locale);
  const seo = await getSeo(cmsPage, locale);
  return seo.metadata;
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("about", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const seo = await getSeo(cmsPage, locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} locale={locale} />
    </>
  );
}
