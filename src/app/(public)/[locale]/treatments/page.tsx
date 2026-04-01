import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { getPublicTreatmentIndexItems, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
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

type PageProps = {
  params: Promise<{ locale: string }>;
};

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

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: TreatmentsPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const treatmentItems = await getPublicTreatmentIndexItems();
  const faqs = extractFaqs(blocks);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const treatmentsLabel = locale === "ar" ? "العلاجات" : "Treatments";
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
    pathname: localizedPathname,
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
      webPageSchema({
        urlPath: localizedPathname,
        title,
        description,
        breadcrumbs: [
          {
            name: homeLabel,
            path: getLocalizedPublicPagePathname("/", locale),
          },
          { name: treatmentsLabel, path: localizedPathname },
        ],
      }),
      collectionPageSchema({
        urlPath: localizedPathname,
        title,
        description,
        items: treatmentItems,
      }),
      ...(faqs.length > 0
        ? [faqPageSchema({ path: localizedPathname, faqs })]
        : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const cmsPage = await getLocalizedCmsPageBySlug("treatments", locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function TreatmentsPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("treatments", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} />
    </>
  );
}
