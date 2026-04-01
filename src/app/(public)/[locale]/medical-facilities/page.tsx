import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import { normalizeBlocks, type BlockInstance } from "@/lib/cms/blocks";
import { type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  assertPublicPageAvailable,
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
import { fetchPublicMedicalFacilitiesDirectory } from "@/server/modules/serviceProviders/public";

export const revalidate = 300;

const PATHNAME = "/medical-facilities";
const fallbackTemplate = getTemplate("medical-facilities-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

type MedicalFacilitiesPageBlock = BlockInstance;

function resolveBlocks(cmsPage: CmsPage | null) {
  const sourceBlocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return normalizeBlocks(sourceBlocks);
}

function extractFaqs(blocks: MedicalFacilitiesPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractAiSummary(blocks: MedicalFacilitiesPageBlock[]) {
  const summaryParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "aboutHero":
        return [
          block.description,
          ...block.highlights.flatMap((item) => [item.kicker, item.label]),
        ];
      case "storyNarrative":
        return [
          block.lead,
          ...(block.paragraphs ?? []),
          block.strengthsTitle,
          ...(block.strengths ?? []).flatMap((item) => [
            item.title,
            item.description,
          ]),
          block.closing,
        ];
      case "medicalFacilitiesDirectory":
        return [
          block.heading,
          block.description,
          block.trustCallout.title,
          block.trustCallout.description,
          block.states.resultsIntro,
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

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: MedicalFacilitiesPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const medicalFacilitiesLabel =
    locale === "ar" ? "المنشآت الطبية" : "Medical Facilities";
  const companyName = getLocalizedCompanyName(locale);
  const directoryData = await fetchPublicMedicalFacilitiesDirectory();
  const faqs = extractFaqs(blocks);
  const aiSummary = extractAiSummary(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        `Accredited Hospitals and Medical Facilities in Egypt | ${companyName}`);
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        `Browse accredited hospitals and medical facilities in Egypt through ${companyName}, with live specialties, procedures, international patient coordination, multilingual support, and recovery-focused planning.`);
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;

  return {
    directoryData,
    seo: await resolveSeo({
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
        aiSummary,
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
            { name: medicalFacilitiesLabel, path: localizedPathname },
          ],
        }),
        collectionPageSchema({
          urlPath: localizedPathname,
          title,
          description,
          items: directoryData.providers.map((provider) => ({
            name: provider.name,
            path: getLocalizedPublicPagePathname(
              `/medical-facilities/${provider.slug}`,
              locale,
            ),
          })),
        }),
        ...(faqs.length > 0
          ? [faqPageSchema({ path: localizedPathname, faqs })]
          : []),
      ],
      modifiedTime: cmsPage?.updated_at ?? undefined,
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  const cmsPage = await getLocalizedCmsPageBySlug("medical-facilities", locale);
  const blocks = resolveBlocks(cmsPage);
  const { seo } = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function MedicalFacilitiesPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("medical-facilities", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks = resolveBlocks(cmsPage);
  const { directoryData, seo } = await getSeo(cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        locale={locale}
        context={{ medicalFacilitiesDirectoryData: directoryData }}
      />
    </>
  );
}
