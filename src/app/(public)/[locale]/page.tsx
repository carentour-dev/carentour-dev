import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";
import Testimonials from "@/components/Testimonials";
import DoctorsSection from "@/components/DoctorsSection";
import CTASection from "@/components/CTASection";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  resolveHomeHeroImageUrl,
  shouldUseLegacyHomepageLayout,
} from "@/lib/cms/pageSettings";
import { type CmsPage } from "@/lib/cms/server";
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
  webPageSchema,
  websiteSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/";

type PageProps = {
  params: Promise<{ locale: string }>;
};

function extractHomepageFaqs(cmsPage: CmsPage | null) {
  if (!cmsPage?.content?.length) {
    return [];
  }

  return cmsPage.content.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

async function getSeo(cmsPage: CmsPage | null, locale: PublicLocale) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : "Care N Tour | Premium Medical Travel in Egypt";

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : "Care N Tour connects international patients with accredited hospitals, verified specialists, and fully coordinated medical travel in Egypt.";

  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;
  const homeFaqs = extractHomepageFaqs(cmsPage);

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
      websiteSchema(),
      webPageSchema({
        urlPath: localizedPathname,
        title,
        description,
      }),
      ...(homeFaqs.length > 0
        ? [faqPageSchema({ path: localizedPathname, faqs: homeFaqs })]
        : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const cmsPage = await getLocalizedCmsPageBySlug("home", locale);
  const seo = await getSeo(cmsPage, locale);
  return seo.metadata;
}

export default async function HomePage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getLocalizedCmsPageBySlug("home", locale);
  const seo = await getSeo(cmsPage, locale);
  const heroImageUrl = resolveHomeHeroImageUrl(cmsPage?.settings);
  const useLegacyHomepageLayout = shouldUseLegacyHomepageLayout(
    cmsPage?.settings,
    cmsPage?.status,
    cmsPage?.content?.length ?? 0,
  );

  if (locale === "ar" && (!cmsPage || useLegacyHomepageLayout)) {
    notFound();
  }

  if (cmsPage?.content?.length && !useLegacyHomepageLayout) {
    return (
      <>
        <StructuredDataScripts payload={seo.jsonLd} />
        <BlockRenderer blocks={cmsPage.content} locale={locale} />
      </>
    );
  }

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <Hero backgroundImageUrl={heroImageUrl} />
      <FeaturedTreatments />
      <ProcessSection />
      <USPSection />
      <DoctorsSection />
      <Testimonials />
      <CTASection />
    </>
  );
}
