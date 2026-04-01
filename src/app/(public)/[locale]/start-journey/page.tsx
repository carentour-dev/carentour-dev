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
import StartJourneyPageClient from "./StartJourneyPageClient";

export const revalidate = 300;

const PATHNAME = "/start-journey";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const DEFAULTS = {
  title: "Start Journey | Care N Tour",
  description:
    "Start your medical tourism journey with guided intake, documents, and scheduling.",
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

export default async function StartJourneyPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo(locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <StartJourneyPageClient />
    </>
  );
}
