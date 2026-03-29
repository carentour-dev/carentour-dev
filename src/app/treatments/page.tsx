import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import {
  getPublicTreatmentIndexItems,
  getPublishedPageBySlug,
  type CmsPage,
} from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import {
  collectionPageSchema,
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/treatments";
const fallbackTemplate = getTemplate("treatments-global");

type TreatmentsPageBlock = BlockInstance | BlockValue;

function extractFaqs(blocks: TreatmentsPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

async function getSeo(cmsPage: CmsPage | null, blocks: TreatmentsPageBlock[]) {
  const treatmentItems = await getPublicTreatmentIndexItems();
  const faqs = extractFaqs(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "Treatments | Care N Tour | Medical Treatments in Egypt");
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Browse medical treatments in Egypt through Care N Tour, with accredited specialists, transparent planning, and coordinated support for international patients.");
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
      webPageSchema({
        urlPath: PATHNAME,
        title,
        description,
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Treatments", path: PATHNAME },
        ],
      }),
      collectionPageSchema({
        urlPath: PATHNAME,
        title,
        description,
        items: treatmentItems,
      }),
      ...(faqs.length > 0 ? [faqPageSchema({ path: PATHNAME, faqs })] : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("treatments");
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks);
  return seo.metadata;
}

export default async function TreatmentsPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getPublishedPageBySlug("treatments");
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks);

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
