import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { BlockInstance } from "@/lib/cms/blocks";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/plan";
type PlanPageBlock = BlockInstance;

function extractFaqs(blocks: PlanPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

async function getSeo(cmsPage: CmsPage | null, blocks: PlanPageBlock[]) {
  const faqs = extractFaqs(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" && cmsPage.seo.title.trim().length
      ? cmsPage.seo.title.trim()
      : "Plan Your Trip | Care N Tour | Medical Travel to Egypt";

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length
      ? cmsPage.seo.description.trim()
      : "Plan medical travel to Egypt with Care N Tour, including treatment coordination, visa guidance, recovery stays, and local patient support.";

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
          { name: "Plan Your Trip", path: PATHNAME },
        ],
      }),
      ...(faqs.length > 0 ? [faqPageSchema({ path: PATHNAME, faqs })] : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("plan");
  const blocks = cmsPage?.content ?? [];
  const seo = await getSeo(cmsPage, blocks);
  return seo.metadata;
}

export default async function PlanPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getPublishedPageBySlug("plan");
  const blocks = cmsPage?.content ?? [];
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
