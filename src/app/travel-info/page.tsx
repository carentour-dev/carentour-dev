import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

const PATHNAME = "/travel-info";
const fallbackTemplate = getTemplate("travel-info");

type TravelInfoPageBlock = BlockInstance | BlockValue;

function extractFaqs(blocks: TravelInfoPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractServices(blocks: TravelInfoPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "serviceCatalog"
      ? block.items.map((item) => ({
          title: item.title,
          description: item.description,
          availability: item.availability,
          bullets: item.bullets ?? [],
          languages: item.languages ?? [],
          note: item.note,
        }))
      : [],
  );
}

function extractAiSummary(blocks: TravelInfoPageBlock[]) {
  const advisory = blocks.find((block) => block.type === "advisoryNotice");

  if (!advisory) {
    return undefined;
  }

  return [
    advisory.description,
    advisory.planningScope,
    advisory.disclaimer,
    advisory.items?.join(" "),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

async function getSeo(cmsPage: CmsPage | null, blocks: TravelInfoPageBlock[]) {
  const faqs = extractFaqs(blocks);
  const services = extractServices(blocks);
  const aiSummary = extractAiSummary(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "Travel Information for International Patients Visiting Egypt | Care N Tour");

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Review entry planning, accommodation, local mobility, payments, language support, and recovery-focused travel guidance for medical trips to Egypt with Care N Tour.");

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
      aiSummary,
    },
    schema: [
      organizationSchema(),
      webPageSchema({
        urlPath: PATHNAME,
        title,
        description,
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Travel Information", path: PATHNAME },
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
            service.note,
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
  const cmsPage = await getPublishedPageBySlug("travel-info");
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks);
  return seo.metadata;
}

export default async function TravelInfoPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const cmsPage = await getPublishedPageBySlug("travel-info");
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
