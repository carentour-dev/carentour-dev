import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  serviceSchema,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/concierge";
const fallbackTemplate = getTemplate("concierge-global");

type ConciergePageBlock = BlockInstance | BlockValue;

function extractFaqs(blocks: ConciergePageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractServices(blocks: ConciergePageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "serviceCatalog"
      ? block.items.map((item) => ({
          title: item.title,
          description: item.description,
          availability: item.availability,
          bullets: item.bullets ?? [],
          languages: item.languages ?? [],
        }))
      : [],
  );
}

async function getSeo(cmsPage: CmsPage | null, blocks: ConciergePageBlock[]) {
  const faqs = extractFaqs(blocks);
  const services = extractServices(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "International Patient Concierge Services | Care N Tour");
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Care N Tour coordinates international patient services in Egypt, including medical scheduling, travel planning, accommodation, airport transfers, multilingual support, and recovery logistics.");
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
          { name: "Concierge", path: PATHNAME },
        ],
      }),
      ...(faqs.length > 0 ? [faqPageSchema({ path: PATHNAME, faqs })] : []),
      ...services.map((service) =>
        serviceSchema({
          path: PATHNAME,
          name: `${service.title} | Care N Tour`,
          serviceType: service.title,
          description: [
            service.description,
            service.availability
              ? `Availability: ${service.availability}.`
              : undefined,
            service.bullets.length > 0 ? service.bullets.join(" ") : undefined,
          ]
            .filter(Boolean)
            .join(" "),
          availableLanguage: service.languages,
        }),
      ),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("concierge");
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks);
  return seo.metadata;
}

export default async function ConciergePage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getPublishedPageBySlug("concierge");
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
