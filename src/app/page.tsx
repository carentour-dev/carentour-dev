import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import WhatsAppCtaGate from "@/components/WhatsAppCtaGate";
import {
  HomeBlockRenderer,
  supportsOptimizedHomeBlocks,
} from "@/components/cms/HomeBlockRenderer";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { PublicShellProvider } from "@/components/public/PublicShellContext";
import PublicUiProviders from "@/components/public/PublicUiProviders";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { defaultPublicLocale, type PublicLocale } from "@/i18n/routing";
import {
  resolveHomeHeroImageUrl,
  resolveHomepageBlocks,
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
  const homepageBlocks = resolveHomepageBlocks(
    cmsPage?.content,
    cmsPage?.updated_at,
  );
  const heroImageUrl = resolveHomeHeroImageUrl(
    cmsPage?.settings,
    cmsPage?.content,
    cmsPage?.updated_at,
  );
  const useLegacyHomepageLayout = shouldUseLegacyHomepageLayout(
    cmsPage?.settings,
    cmsPage?.status,
    cmsPage?.content?.length ?? 0,
  );
  const initialNavigationLinks =
    navigationResult.links.filter(isNavigationVisible);
  const canUseOptimizedHomeRenderer =
    homepageBlocks.length > 0 &&
    !useLegacyHomepageLayout &&
    supportsOptimizedHomeBlocks(homepageBlocks);
  const legacyHomepage = useLegacyHomepageLayout
    ? await import("@/components/home/LegacyHomepage").then(
        ({ default: LegacyHomepage }) => (
          <LegacyHomepage heroImageUrl={heroImageUrl} />
        ),
      )
    : null;
  const genericCmsHomepage =
    homepageBlocks.length > 0 &&
    !useLegacyHomepageLayout &&
    !canUseOptimizedHomeRenderer
      ? await import("@/components/cms/BlockRenderer").then(
          ({ BlockRenderer }) => <BlockRenderer blocks={homepageBlocks} />,
        )
      : null;

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <PublicUiProviders>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PublicShellProvider>
            <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
              <MicrosoftClarity />
              <div
                lang={locale}
                dir={getPublicDirection(locale)}
                className="flex min-h-screen flex-col"
              >
                <PublicHeader
                  locale={locale}
                  navigationLinks={initialNavigationLinks}
                />
                <main className="flex-1">
                  {canUseOptimizedHomeRenderer ? (
                    <HomeBlockRenderer
                      blocks={homepageBlocks}
                      locale={locale}
                    />
                  ) : (
                    (genericCmsHomepage ?? legacyHomepage)
                  )}
                </main>
                <PublicFooter
                  locale={locale}
                  navigationLinks={initialNavigationLinks}
                />
              </div>
              <WhatsAppCtaGate />
            </NavigationProvider>
          </PublicShellProvider>
        </NextIntlClientProvider>
      </PublicUiProviders>
    </>
  );
}
