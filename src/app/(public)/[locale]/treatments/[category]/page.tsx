import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import { normalizeBlocks, type BlockInstance } from "@/lib/cms/blocks";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import { localizeTreatmentDetailCmsFallback } from "@/lib/public/treatmentDetailCmsFallback";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  collectionPageSchema,
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  medicalProcedureSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import {
  getLocalizedPublicTreatmentDetail,
  getLocalizedPublicTreatments,
} from "@/server/modules/treatments/public";

export const revalidate = 300;

const DETAIL_TEMPLATE_PAGE_SLUG = "treatment-detail-template";
const fallbackTemplate = getTemplate("treatment-detail-global");

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

type TreatmentDetailBlock = BlockInstance;

async function getTreatmentCmsPage(locale: PublicLocale) {
  const localized = await getLocalizedCmsPageBySlug(
    DETAIL_TEMPLATE_PAGE_SLUG,
    locale,
  );

  if (localized) {
    return {
      page: localized,
      hasLocalizedTranslation: true,
    };
  }

  if (locale !== "en") {
    return {
      page: await getPublishedPageBySlug(DETAIL_TEMPLATE_PAGE_SLUG),
      hasLocalizedTranslation: false,
    };
  }

  return {
    page: null,
    hasLocalizedTranslation: false,
  };
}

function resolveBlocks({
  cmsPage,
  locale,
  hasLocalizedTranslation,
}: {
  cmsPage: CmsPage | null;
  locale: PublicLocale;
  hasLocalizedTranslation: boolean;
}) {
  const sourceBlocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : normalizeBlocks(fallbackTemplate?.blocks ?? []);

  if (locale === "ar" && !hasLocalizedTranslation) {
    return localizeTreatmentDetailCmsFallback(sourceBlocks, locale);
  }

  return sourceBlocks;
}

function extractFaqs(blocks: TreatmentDetailBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractAiSummary(
  blocks: TreatmentDetailBlock[],
  detail: NonNullable<
    Awaited<ReturnType<typeof getLocalizedPublicTreatmentDetail>>
  >,
) {
  const treatment = detail.treatment;
  const summaryParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "treatmentDetail":
        return [
          block.trustStatement,
          block.sectionDescriptions.overview,
          block.sectionDescriptions.procedures,
          block.sectionDescriptions.specialists,
          block.sectionDescriptions.patientStories,
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

  return [
    treatment.name,
    treatment.summary,
    treatment.description,
    treatment.overview,
    ...treatment.idealCandidates,
    ...treatment.procedures.flatMap((procedure) => [
      procedure.name,
      procedure.description,
      procedure.recovery,
      procedure.price,
    ]),
    ...summaryParts,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();
}

async function getSeo(
  slug: string,
  detail: NonNullable<
    Awaited<ReturnType<typeof getLocalizedPublicTreatmentDetail>>
  >,
  cmsPage: CmsPage | null,
  blocks: TreatmentDetailBlock[],
  locale: PublicLocale,
) {
  const pathname = `/treatments/${slug}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const treatment = detail.treatment;
  const seo = detail.seo ?? null;
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const treatmentsLabel = locale === "ar" ? "العلاجات" : "Treatments";
  const defaultTitle =
    seo?.title?.trim() || `${treatment.name} | Treatments | Care N Tour`;
  const defaultDescription =
    seo?.description?.trim() ||
    treatment.summary ||
    treatment.description ||
    "Learn more about this treatment option available through Care N Tour.";
  const faqs = extractFaqs(blocks);
  const aiSummary = extractAiSummary(blocks, detail);

  return resolveSeo({
    routeKey: pathname,
    pathname: localizedPathname,
    locale,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: {
      title: defaultTitle,
      description: defaultDescription,
      ogImageUrl: treatment.heroImageUrl ?? treatment.cardImageUrl,
      aiSummary,
    },
    schema: [
      webPageSchema({
        urlPath: localizedPathname,
        title: defaultTitle,
        description: defaultDescription,
        breadcrumbs: [
          {
            name: homeLabel,
            path: getLocalizedPublicPagePathname("/", locale),
          },
          {
            name: treatmentsLabel,
            path: getLocalizedPublicPagePathname("/treatments", locale),
          },
          { name: treatment.name, path: localizedPathname },
        ],
      }),
      medicalProcedureSchema({
        path: localizedPathname,
        name: treatment.name,
        description: defaultDescription,
      }),
      collectionPageSchema({
        urlPath: localizedPathname,
        title: `${treatment.name} procedures`,
        description: treatment.overview ?? defaultDescription,
        items: treatment.procedures.map((procedure) => ({
          name: procedure.name,
          path: localizedPathname,
        })),
      }),
      ...treatment.procedures.map((procedure) => ({
        "@context": "https://schema.org",
        "@type": "MedicalProcedure",
        name: procedure.name,
        description:
          procedure.description ?? procedure.recovery ?? defaultDescription,
        url: localizedPathname,
      })),
      ...(faqs.length > 0
        ? [faqPageSchema({ path: localizedPathname, faqs })]
        : []),
    ],
    indexable: true,
    imageUrl: treatment.heroImageUrl ?? treatment.cardImageUrl,
    modifiedTime: detail.updatedAt ?? cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/treatments/${category}`, locale);
  const detail = await getLocalizedPublicTreatmentDetail(locale, category);

  if (!detail) {
    return {};
  }

  const cmsPageResult = await getTreatmentCmsPage(locale);
  const blocks = resolveBlocks({
    cmsPage: cmsPageResult.page,
    locale,
    hasLocalizedTranslation: cmsPageResult.hasLocalizedTranslation,
  });
  const seo = await getSeo(
    category,
    detail,
    cmsPageResult.page,
    blocks,
    locale,
  );
  return seo.metadata;
}

export default async function TreatmentCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/treatments/${category}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const [detail, treatmentOptions] = await Promise.all([
    getLocalizedPublicTreatmentDetail(locale, category),
    getLocalizedPublicTreatments({ locale, limit: 100 }),
  ]);

  if (!detail) {
    notFound();
  }

  const cmsPageResult = await getTreatmentCmsPage(locale);
  const blocks = resolveBlocks({
    cmsPage: cmsPageResult.page,
    locale,
    hasLocalizedTranslation: cmsPageResult.hasLocalizedTranslation,
  });
  const seo = await getSeo(
    category,
    detail,
    cmsPageResult.page,
    blocks,
    locale,
  );

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        locale={locale}
        context={{
          treatmentDetail: detail,
          treatmentSlug: category,
          treatmentOptions: treatmentOptions.map((treatment) => ({
            slug: treatment.slug,
            name: treatment.name,
          })),
        }}
      />
    </>
  );
}
