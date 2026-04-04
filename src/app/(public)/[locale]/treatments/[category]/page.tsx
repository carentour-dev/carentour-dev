import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  maybeRedirectFromLegacyPath,
  medicalProcedureSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getLocalizedPublicTreatmentDetail } from "@/server/modules/treatments/public";
import TreatmentCategoryPageClient from "./TreatmentCategoryPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

async function getSeo(category: string, locale: PublicLocale) {
  const pathname = `/treatments/${category}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const detail = await getLocalizedPublicTreatmentDetail(locale, category);
  const treatment = detail?.treatment ?? null;
  const seo = detail?.seo ?? null;
  const treatmentsLabel = locale === "ar" ? "العلاجات" : "Treatments";
  const defaultTitle = treatment
    ? (seo?.title ?? `${treatment.name} | Treatments | Care N Tour`)
    : "Treatment | Care N Tour";
  const defaultDescription =
    seo?.description ??
    treatment?.summary ??
    treatment?.description ??
    "Learn more about this treatment option available through Care N Tour.";

  return resolveSeo({
    routeKey: pathname,
    pathname: localizedPathname,
    locale,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: treatment
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: treatment.heroImageUrl ?? treatment.cardImageUrl,
        }
      : undefined,
    schema: treatment
      ? [
          webPageSchema({
            urlPath: localizedPathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
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
        ]
      : webPageSchema({
          urlPath: localizedPathname,
          title: defaultTitle,
          description: defaultDescription,
        }),
    indexable: Boolean(treatment),
    modifiedTime: detail?.updatedAt ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/treatments/${category}`, locale);
  const seo = await getSeo(category, locale);
  return seo.metadata;
}

export default async function TreatmentCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/treatments/${category}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);
  const detail = await getLocalizedPublicTreatmentDetail(locale, category);

  if (!detail) {
    notFound();
  }

  const seo = await getSeo(category, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <TreatmentCategoryPageClient
        locale={locale}
        slug={category}
        treatment={detail.treatment}
      />
    </>
  );
}
