import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";
import Testimonials from "@/components/Testimonials";
import DoctorsSection from "@/components/DoctorsSection";
import CTASection from "@/components/CTASection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppProviders from "@/components/AppProviders";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import WhatsAppCtaGate from "@/components/WhatsAppCtaGate";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { PublicShellProvider } from "@/components/public/PublicShellContext";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { defaultPublicLocale, type PublicLocale } from "@/i18n/routing";
import {
  resolveHomeHeroImageUrl,
  shouldUseLegacyHomepageLayout,
} from "@/lib/cms/pageSettings";
import { type CmsPage } from "@/lib/cms/server";
import { isNavigationVisible } from "@/lib/navigation";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import { getPublicDirection } from "@/lib/public/routing";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo";
import { loadPublicNavigationLinks } from "@/server/navigation";

export const revalidate = 300;

const PATHNAME = "/";
const locale = defaultPublicLocale;

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
    pathname: PATHNAME,
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
        urlPath: PATHNAME,
        title,
        description,
      }),
      ...(homeFaqs.length > 0
        ? [faqPageSchema({ path: PATHNAME, faqs: homeFaqs })]
        : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getLocalizedCmsPageBySlug("home", locale);
  const seo = await getSeo(cmsPage, locale);
  return seo.metadata;
}

export default async function RootHomePage() {
  setRequestLocale(locale);

  await maybeRedirectFromLegacyPath(PATHNAME);

  const [messages, navigationResult, cmsPage] = await Promise.all([
    getMessages(),
    loadPublicNavigationLinks(locale),
    getLocalizedCmsPageBySlug("home", locale),
  ]);
  const seo = await getSeo(cmsPage, locale);
  const heroImageUrl = resolveHomeHeroImageUrl(cmsPage?.settings);
  const useLegacyHomepageLayout = shouldUseLegacyHomepageLayout(
    cmsPage?.settings,
    cmsPage?.status,
    cmsPage?.content?.length ?? 0,
  );
  const initialNavigationLinks =
    navigationResult.links.filter(isNavigationVisible);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <AppProviders>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PublicShellProvider>
            <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
              <MicrosoftClarity />
              <div
                lang={locale}
                dir={getPublicDirection(locale)}
                className="flex min-h-screen flex-col"
              >
                <Header forceRender />
                <main className="flex-1">
                  {cmsPage?.content?.length && !useLegacyHomepageLayout ? (
                    <BlockRenderer blocks={cmsPage.content} />
                  ) : (
                    <>
                      <Hero backgroundImageUrl={heroImageUrl} />
                      <FeaturedTreatments />
                      <ProcessSection />
                      <USPSection />
                      <DoctorsSection />
                      <Testimonials />
                      <CTASection />
                    </>
                  )}
                </main>
                <Footer forceRender />
              </div>
              <WhatsAppCtaGate />
            </NavigationProvider>
          </PublicShellProvider>
        </NextIntlClientProvider>
      </AppProviders>
    </>
  );
}
