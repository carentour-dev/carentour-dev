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
import { pickFacilityImage } from "@/lib/medical-facilities";
import {
  maybeRedirectFromLegacyPath,
  medicalOrganizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { fetchPublicServiceProviderBySlug } from "@/server/modules/serviceProviders/public";

export const revalidate = 300;

const DETAIL_TEMPLATE_PAGE_SLUG = "medical-facilities-detail-template";
const fallbackTemplate = getTemplate("medical-facilities-detail-global");

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

type MedicalFacilityDetailBlock = BlockInstance;

function resolveBlocks(cmsPage: CmsPage | null) {
  const sourceBlocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return normalizeBlocks(sourceBlocks);
}

function extractAiSummary(
  blocks: MedicalFacilityDetailBlock[],
  providerOverview: string,
) {
  const summaryParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "medicalFacilityProfile":
        return [
          block.eyebrow,
          block.trustStatement,
          block.sectionDescriptions.overview,
          block.sectionDescriptions.procedures,
          block.sectionDescriptions.contact,
        ];
      case "callToAction":
        return [block.heading, block.description];
      default:
        return [];
    }
  });

  return [providerOverview, ...summaryParts]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();
}

function resolveModifiedTime(
  cmsPage: CmsPage | null,
  providerUpdatedAt: string | null | undefined,
) {
  const providerTime = providerUpdatedAt ? Date.parse(providerUpdatedAt) : NaN;
  const cmsTime = cmsPage?.updated_at ? Date.parse(cmsPage.updated_at) : NaN;

  if (!Number.isNaN(providerTime) && !Number.isNaN(cmsTime)) {
    return new Date(Math.max(providerTime, cmsTime)).toISOString();
  }

  if (!Number.isNaN(providerTime)) {
    return providerUpdatedAt ?? undefined;
  }

  if (!Number.isNaN(cmsTime)) {
    return cmsPage?.updated_at ?? undefined;
  }

  return undefined;
}

async function getSeo(
  slug: string,
  detail: NonNullable<
    Awaited<ReturnType<typeof fetchPublicServiceProviderBySlug>>
  >,
  cmsPage: CmsPage | null,
  blocks: MedicalFacilityDetailBlock[],
  locale: PublicLocale,
) {
  const pathname = `/medical-facilities/${slug}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const provider = detail.provider;
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const medicalFacilitiesLabel =
    locale === "ar" ? "المنشآت الطبية" : "Medical Facilities";
  const companyName = getLocalizedCompanyName(locale);
  const defaultTitle = `${provider.name} | ${medicalFacilitiesLabel} | ${companyName}`;
  const defaultDescription =
    provider.overview ??
    provider.description ??
    "Explore details about this medical facility.";
  const image =
    pickFacilityImage(provider) ||
    (typeof cmsPage?.seo?.ogImage === "string" ? cmsPage.seo.ogImage : null);
  const aiSummary = extractAiSummary(blocks, defaultDescription);

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
      ogImageUrl: image,
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
            name: medicalFacilitiesLabel,
            path: getLocalizedPublicPagePathname("/medical-facilities", locale),
          },
          { name: provider.name, path: localizedPathname },
        ],
      }),
      medicalOrganizationSchema({
        path: localizedPathname,
        name: provider.name,
        description: defaultDescription,
        imageUrl: image,
      }),
    ],
    indexable: true,
    imageUrl: image,
    modifiedTime: resolveModifiedTime(cmsPage, provider.updated_at),
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/medical-facilities/${slug}`, locale);
  const detail = await fetchPublicServiceProviderBySlug(slug);

  if (!detail) {
    return {};
  }

  const cmsPage = await getLocalizedCmsPageBySlug(
    DETAIL_TEMPLATE_PAGE_SLUG,
    locale,
  );
  const blocks = resolveBlocks(cmsPage);
  const seo = await getSeo(slug, detail, cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function MedicalFacilityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/medical-facilities/${slug}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);

  const detail = await fetchPublicServiceProviderBySlug(slug);

  if (!detail) {
    notFound();
  }

  const cmsPage = await getLocalizedCmsPageBySlug(
    DETAIL_TEMPLATE_PAGE_SLUG,
    locale,
  );
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks = resolveBlocks(cmsPage);
  const seo = await getSeo(slug, detail, cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer
        blocks={blocks}
        context={{
          medicalFacility: detail,
          medicalFacilitySlug: slug,
        }}
      />
    </>
  );
}
