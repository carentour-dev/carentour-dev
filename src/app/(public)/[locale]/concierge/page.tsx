import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  serviceSchema,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/concierge";
const fallbackTemplate = getTemplate("concierge-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ConciergePageBlock = BlockInstance | BlockValue;

function getConciergeSeoDefaults(locale: PublicLocale, companyName: string) {
  if (locale === "ar") {
    return {
      title: `خدمات تنسيق المرضى الدوليين | ${companyName}`,
      description: `ينسق ${companyName} خدمات المرضى الدوليين في مصر، بما يشمل المواعيد الطبية، وتخطيط السفر، والإقامة، والاستقبال من المطار، والدعم متعدد اللغات، وترتيبات التعافي.`,
      availabilityLabel: "التوفر",
    };
  }

  return {
    title: `International Patient Concierge Services | ${companyName}`,
    description: `${companyName} coordinates international patient services in Egypt, including medical scheduling, travel planning, accommodation, airport transfers, multilingual support, and recovery logistics.`,
    availabilityLabel: "Availability",
  };
}

function extractFaqs(blocks: ConciergePageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractServices(blocks: ConciergePageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "serviceCatalog"
      ? block.items.map((item) => ({
          title: item.title,
          description: item.description,
          availability: item.availability,
          bullets: item.bullets ?? [],
          languages: item.languages ?? [],
        }))
      : [],
  );
}

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: ConciergePageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const seoDefaults = getConciergeSeoDefaults(locale, companyName);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const conciergeLabel = locale === "ar" ? "خدمات التنسيق" : "Concierge";
  const faqs = extractFaqs(blocks);
  const services = extractServices(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : locale === "ar"
        ? seoDefaults.title
        : (fallbackTemplate?.seo?.title ?? seoDefaults.title);
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : locale === "ar"
        ? seoDefaults.description
        : (fallbackTemplate?.seo?.description ?? seoDefaults.description);
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
      organizationSchema(),
      webPageSchema({
        urlPath: localizedPathname,
        title,
        description,
        breadcrumbs: [
          {
            name: homeLabel,
            path: getLocalizedPublicPagePathname("/", locale),
          },
          { name: conciergeLabel, path: localizedPathname },
        ],
      }),
      ...(faqs.length > 0
        ? [faqPageSchema({ path: localizedPathname, faqs })]
        : []),
      ...services.map((service) =>
        serviceSchema({
          path: localizedPathname,
          name: `${service.title} | ${companyName}`,
          serviceType: service.title,
          description: [
            service.description,
            service.availability
              ? `${seoDefaults.availabilityLabel}: ${service.availability}.`
              : undefined,
            service.bullets.length > 0 ? service.bullets.join(" ") : undefined,
          ]
            .filter(Boolean)
            .join(" "),
          availableLanguage: service.languages,
        }),
      ),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const cmsPage = await getLocalizedCmsPageBySlug("concierge", locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function ConciergePage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getLocalizedCmsPageBySlug("concierge", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} locale={locale} />
    </>
  );
}
