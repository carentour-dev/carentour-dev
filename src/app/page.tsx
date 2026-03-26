import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";
import Testimonials from "@/components/Testimonials";
import DoctorsSection from "@/components/DoctorsSection";
import CTASection from "@/components/CTASection";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  resolveHomeHeroImageUrl,
  shouldUseLegacyHomepageLayout,
} from "@/lib/cms/pageSettings";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import {
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/";

async function getSeo(cmsPage: CmsPage | null) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : "Care N Tour | World-Class Medical Care in Egypt";

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : "Experience premium medical treatments in Egypt with significant cost savings.";

  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return resolveSeo({
    routeKey: PATHNAME,
    pathname: PATHNAME,
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
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("home");
  const seo = await getSeo(cmsPage);
  return seo.metadata;
}

export default async function HomePage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getPublishedPageBySlug("home");
  const seo = await getSeo(cmsPage);
  const heroImageUrl = resolveHomeHeroImageUrl(cmsPage?.settings);
  const useLegacyHomepageLayout = shouldUseLegacyHomepageLayout(
    cmsPage?.settings,
    cmsPage?.status,
    cmsPage?.content?.length ?? 0,
  );

  if (cmsPage?.content?.length && !useLegacyHomepageLayout) {
    return (
      <>
        <StructuredDataScripts payload={seo.jsonLd} />
        <div className="min-h-screen">
          <Header />
          <main>
            <BlockRenderer blocks={cmsPage.content} />
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero backgroundImageUrl={heroImageUrl} />
          <FeaturedTreatments />
          <ProcessSection />
          <USPSection />
          <DoctorsSection />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
