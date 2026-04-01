import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { type CmsPage } from "@/lib/cms/server";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
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

type PageProps = {
  params: Promise<{ locale: string }>;
};

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

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: PlanPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const planLabel = locale === "ar" ? "خطط لرحلتك" : "Plan Your Trip";
  const faqs = extractFaqs(blocks);
  const title =
    typeof cmsPage?.seo?.title === "string" && cmsPage.seo.title.trim().length
      ? cmsPage.seo.title.trim()
      : `Plan Your Trip | ${companyName} | Medical Travel to Egypt`;

  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length
      ? cmsPage.seo.description.trim()
      : `Plan medical travel to Egypt with ${companyName}, including treatment coordination, visa guidance, recovery stays, and local patient support.`;

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
          { name: planLabel, path: localizedPathname },
        ],
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
  const cmsPage = await getLocalizedCmsPageBySlug("plan", locale);
  const blocks = cmsPage?.content ?? [];
  const seo = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function PlanPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("plan", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks = cmsPage?.content ?? [];
  const seo = await getSeo(cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} locale={locale} />
    </>
  );
}
