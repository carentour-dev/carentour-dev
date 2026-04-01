import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import { type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import {
  getLocalizedCmsPageBySlug,
  getLocalizedFaqs,
} from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/faq";
const fallbackTemplate = getTemplate("faq-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

function getFaqContentModifiedTime(
  cmsPage: CmsPage | null,
  faqResult: Awaited<ReturnType<typeof getLocalizedFaqs>>,
) {
  const timestamps = [
    cmsPage?.updated_at,
    ...faqResult.faqs.flatMap((entry) => [entry.updated_at, entry.created_at]),
    ...faqResult.categories.flatMap((entry) => [
      entry.updated_at,
      entry.created_at,
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    return cmsPage?.updated_at ?? undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

async function getSeo(
  cmsPage: CmsPage | null,
  faqResult: Awaited<ReturnType<typeof getLocalizedFaqs>>,
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const faqLabel = locale === "ar" ? "الأسئلة الشائعة" : "FAQ";
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        `FAQ for International Patients Seeking Treatment in Egypt | ${companyName}`);
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        `Read ${companyName}'s FAQ for international patients seeking treatment in Egypt, with answers on doctors, accredited hospitals, medical travel planning, pricing, accommodation, safety, recovery, and follow-up.`);
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;
  const faqSchema = faqPageSchema({
    path: localizedPathname,
    faqs: faqResult.faqs.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
    })),
  });

  const seo = await resolveSeo({
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
          { name: faqLabel, path: localizedPathname },
        ],
      }),
      organizationSchema(),
      faqSchema,
    ],
    modifiedTime: getFaqContentModifiedTime(cmsPage, faqResult),
  });

  return seo;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const [cmsPage, faqResult] = await Promise.all([
    getLocalizedCmsPageBySlug("faq", locale),
    getLocalizedFaqs(locale),
  ]);
  const seo = await getSeo(cmsPage, faqResult, locale);
  return seo.metadata;
}

export default async function FAQPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const [cmsPage, faqResult] = await Promise.all([
    getLocalizedCmsPageBySlug("faq", locale),
    getLocalizedFaqs(locale),
  ]);
  if (locale === "ar" && (!cmsPage || faqResult.source !== "cms")) {
    notFound();
  }
  const seo = await getSeo(cmsPage, faqResult, locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} />
    </>
  );
}
