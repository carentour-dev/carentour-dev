import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import TravelInfoFallbackClient from "./TravelInfoFallbackClient";

export const revalidate = 300;

const PATHNAME = "/travel-info";

async function getSeo(cmsPage: CmsPage | null) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : "Travel Info | Care N Tour";

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : "Plan visas, accommodation, and travel logistics for medical treatment in Egypt.";

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
    schema: webPageSchema({
      urlPath: PATHNAME,
      title,
      description,
    }),
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("travel-info");
  const seo = await getSeo(cmsPage);
  return seo.metadata;
}

export default async function TravelInfoPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getPublishedPageBySlug("travel-info");
  const seo = await getSeo(cmsPage);

  if (cmsPage?.content?.length) {
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
      <TravelInfoFallbackClient />
    </>
  );
}
