import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export const revalidate = 300;

const INTERNAL_CMS_TEMPLATE_SLUGS = new Set([
  "medical-facilities-detail-template",
]);

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getSeo(pathname: string, cmsPage: CmsPage | null) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : cmsPage?.title
        ? `${cmsPage.title} | Care N Tour`
        : "Care N Tour";

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : undefined;

  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title,
      description,
    },
    source: cmsPage
      ? {
          title,
          description,
          ogImageUrl: ogImage,
        }
      : undefined,
    schema: webPageSchema({
      urlPath: pathname,
      title,
      description,
    }),
    indexable: Boolean(cmsPage),
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pathname = `/${slug}`;
  const cmsPage = await getPublishedPageBySlug(slug);
  const seo = await getSeo(pathname, cmsPage);
  return seo.metadata;
}

export default async function GenericCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const pathname = `/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);

  if (INTERNAL_CMS_TEMPLATE_SLUGS.has(slug)) {
    return notFound();
  }

  const cmsPage = await getPublishedPageBySlug(slug);

  if (!cmsPage || !cmsPage.content?.length) {
    return notFound();
  }

  const seo = await getSeo(pathname, cmsPage);

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
