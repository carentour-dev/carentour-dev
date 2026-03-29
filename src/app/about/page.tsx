import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import {
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/about";
const fallbackTemplate = getTemplate("about-global");

async function getSeo(cmsPage: CmsPage | null) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "About Care N Tour | Medical Tourism Experts in Egypt");

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Learn how Care N Tour guides international patients to trusted treatment providers in Egypt with verified partners, coordinated planning, and personal support.");

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
      webPageSchema({
        urlPath: PATHNAME,
        title,
        description,
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "About Us", path: PATHNAME },
        ],
      }),
      organizationSchema(),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("about");
  const seo = await getSeo(cmsPage);
  return seo.metadata;
}

export default async function AboutPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getPublishedPageBySlug("about");
  const seo = await getSeo(cmsPage);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <div className="min-h-screen">
        <Header />
        <main>
          <BlockRenderer blocks={blocks} />
        </main>
        <Footer />
      </div>
    </>
  );
}
