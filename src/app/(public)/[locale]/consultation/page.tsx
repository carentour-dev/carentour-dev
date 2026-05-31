import { PublicAuthQueryBoundary } from "@/components/public/PublicInteractiveProviders";
import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getConfiguredMedicalConsultationPaymentLink } from "@/server/modules/consultations/payment";
import ConsultationPageClient from "./ConsultationPageClient";

export const revalidate = 300;

const PATHNAME = "/consultation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const DEFAULTS = {
  title: "Book a Consultation | Care N Tour",
  description:
    "Choose a free care-coordination consultation or a paid medical consultation with specialist guidance.",
};

async function getSeo(locale: PublicLocale) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  return resolveSeo({
    routeKey: PATHNAME,
    pathname: localizedPathname,
    locale,
    defaults: DEFAULTS,
    schema: webPageSchema({
      urlPath: localizedPathname,
      title: DEFAULTS.title,
      description: DEFAULTS.description,
    }),
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  const seo = await getSeo(locale);
  return seo.metadata;
}

export default async function ConsultationPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo(locale);
  const medicalConsultationPaymentLink =
    getConfiguredMedicalConsultationPaymentLink();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <PublicAuthQueryBoundary>
        <ConsultationPageClient
          medicalConsultationPaymentLink={medicalConsultationPaymentLink}
        />
      </PublicAuthQueryBoundary>
    </>
  );
}
