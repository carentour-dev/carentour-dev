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

const PATHNAME = "/travel-info";
const fallbackTemplate = getTemplate("travel-info");

type PageProps = {
  params: Promise<{ locale: string }>;
};

type TravelInfoPageBlock = BlockInstance | BlockValue;

function getTravelInfoSeoDefaults(locale: PublicLocale, companyName: string) {
  if (locale === "ar") {
    return {
      title: `معلومات السفر للمرضى الدوليين القادمين إلى مصر | ${companyName}`,
      description: `راجع معلومات الدخول، والإقامة، والتنقل المحلي، والمدفوعات، والدعم اللغوي، وإرشادات السفر المناسبة لفترة التعافي عند التخطيط لرحلتك العلاجية إلى مصر مع ${companyName}.`,
      availabilityLabel: "التوفر",
    };
  }

  return {
    title: `Travel Information for International Patients Visiting Egypt | ${companyName}`,
    description: `Review entry planning, accommodation, local mobility, payments, language support, and recovery-focused travel guidance for medical trips to Egypt with ${companyName}.`,
    availabilityLabel: "Availability",
  };
}

function extractFaqs(blocks: TravelInfoPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractServices(blocks: TravelInfoPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "serviceCatalog"
      ? block.items.map((item) => ({
          title: item.title,
          description: item.description,
          availability: item.availability,
          bullets: item.bullets ?? [],
          languages: item.languages ?? [],
          note: item.note,
        }))
      : [],
  );
}

function extractAiSummary(blocks: TravelInfoPageBlock[]) {
  const advisory = blocks.find((block) => block.type === "advisoryNotice");

  if (!advisory) {
    return undefined;
  }

  return [
    advisory.description,
    advisory.planningScope,
    advisory.disclaimer,
    advisory.items?.join(" "),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: TravelInfoPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const seoDefaults = getTravelInfoSeoDefaults(locale, companyName);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const travelInfoLabel =
    locale === "ar" ? "معلومات السفر" : "Travel Information";
  const faqs = extractFaqs(blocks);
  const services = extractServices(blocks);
  const aiSummary = extractAiSummary(blocks);
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
      aiSummary,
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
          { name: travelInfoLabel, path: localizedPathname },
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
            service.note,
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
  const cmsPage = await getLocalizedCmsPageBySlug("travel-info", locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function TravelInfoPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getLocalizedCmsPageBySlug("travel-info", locale);
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
      <BlockRenderer blocks={blocks} />
    </>
  );
}
