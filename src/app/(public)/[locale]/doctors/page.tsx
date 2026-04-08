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
import { fetchPublicDoctorDirectory } from "@/server/modules/doctors/public";

export const revalidate = 300;

const PATHNAME = "/doctors";
const fallbackTemplate = getTemplate("doctors-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

type DoctorsPageBlock = BlockInstance;

function resolveBlocks(cmsPage: CmsPage | null) {
  const sourceBlocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return normalizeBlocks(sourceBlocks);
}

function extractFaqs(blocks: DoctorsPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractAiSummary(blocks: DoctorsPageBlock[], companyName: string) {
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
      case "doctorDirectory":
        return [
          block.heading,
          block.description,
          block.trustCallout.title,
          block.trustCallout.description,
          block.states.resultsIntro,
        ];
      case "faq":
        return block.items.flatMap((item) => [item.question, item.answer]);
      case "callToAction":
        return [block.heading, block.description];
      default:
        return [];
    }
  });

  return [companyName, ...summaryParts]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();
}

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: DoctorsPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const doctorsLabel = locale === "ar" ? "الأطباء" : "Our Doctors";
  const companyName = getLocalizedCompanyName(locale);
  const directoryData = await fetchPublicDoctorDirectory({}, locale);
  const faqs = extractFaqs(blocks);
  const aiSummary = extractAiSummary(blocks, companyName);
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ?? `Our Doctors | ${companyName}`);
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        `Meet specialist doctors represented by ${companyName}, with live profile search by specialty and language for international patients planning treatment in Egypt.`);
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
            { name: doctorsLabel, path: localizedPathname },
          ],
        }),
        collectionPageSchema({
          urlPath: localizedPathname,
          title,
          description,
          items: directoryData.doctors.map((doctor) => ({
            name: doctor.name,
            path: getLocalizedPublicPagePathname(
              `/doctors/${doctor.id}`,
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
  const cmsPage = await getLocalizedCmsPageBySlug("doctors", locale);
  const blocks = resolveBlocks(cmsPage);
  const { seo } = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function DoctorsPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("doctors", locale);
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
        context={{ doctorDirectoryData: directoryData }}
      />
    </>
  );
}
