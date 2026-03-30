import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import {
  contactPageSchema,
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationContactSchema,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/contact";
const fallbackTemplate = getTemplate("contact-global");

type ContactPageBlock = BlockInstance | BlockValue;

function extractFaqs(blocks: ContactPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractContactPoints(blocks: ContactPageBlock[]) {
  const contactBlock = blocks.find(
    (block): block is BlockValue<"contactFormEmbed"> =>
      block.type === "contactFormEmbed",
  );

  if (!contactBlock) {
    return [];
  }

  return contactBlock.channels
    .map((channel) => {
      const href = channel.href?.trim() ?? "";
      const content = channel.content.trim();
      const isTelephone = href.startsWith("tel:");
      const isEmail = href.startsWith("mailto:");
      const isUrl = href.startsWith("https://") || href.startsWith("http://");

      return {
        contactType: channel.schemaContactType ?? "customer support",
        telephone: isTelephone ? href.replace(/^tel:/, "") : undefined,
        email: isEmail ? href.replace(/^mailto:/, "") : undefined,
        url: isUrl ? href : undefined,
        areaServed: ["International"],
        availableLanguage: ["English", "Arabic"],
        fallbackContent: !isTelephone && !isEmail && !isUrl ? content : null,
      };
    })
    .map(({ fallbackContent, ...point }) => point);
}

function extractAiSummary(blocks: ContactPageBlock[]) {
  const summaryParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "aboutHero":
        return [block.description];
      case "serviceCatalog":
        return [
          block.description,
          ...block.items.flatMap((item) => [
            item.title,
            item.description,
            ...(item.bullets ?? []),
          ]),
        ];
      case "contactFormEmbed":
        return [
          block.description,
          block.channelsDescription,
          block.supportDescription,
          ...(block.supportItems ?? []),
        ];
      case "faq":
        return block.items.flatMap((item) => [item.question, item.answer]);
      default:
        return [];
    }
  });

  return summaryParts
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();
}

async function getSeo(cmsPage: CmsPage | null, blocks: ContactPageBlock[]) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "Contact Care N Tour | International Patient, Partner & Corporate Enquiries");
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Contact Care N Tour for treatment planning, international patient support, referral coordination, and corporate or partner enquiries related to medical travel in Egypt.");
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;
  const faqs = extractFaqs(blocks);
  const contactPoints = extractContactPoints(blocks);
  const aiSummary = extractAiSummary(blocks);

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
          { name: "Contact Us", path: PATHNAME },
        ],
      }),
      contactPageSchema({
        path: PATHNAME,
        title,
        description,
      }),
      ...(contactPoints.length > 0
        ? [organizationContactSchema({ contactPoints })]
        : []),
      ...(faqs.length > 0 ? [faqPageSchema({ path: PATHNAME, faqs })] : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedPageBySlug("contact");
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks);
  return seo.metadata;
}

export default async function ContactPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getPublishedPageBySlug("contact");
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
