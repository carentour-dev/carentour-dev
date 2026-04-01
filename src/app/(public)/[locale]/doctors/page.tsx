import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import DoctorsPageClient from "./DoctorsPageClient";

export const revalidate = 300;

const PATHNAME = "/doctors";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const DEFAULTS = {
  title: "Our Doctors | Care N Tour",
  description:
    "Meet experienced specialist doctors supporting patient journeys with Care N Tour.",
};

async function getSeo(locale: PublicLocale) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  return resolveSeo({
    routeKey: PATHNAME,
    pathname: localizedPathname,
    locale,
    defaults: DEFAULTS,
    schema: collectionPageSchema({
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

export default async function DoctorsPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo(locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <DoctorsPageClient />
    </>
  );
}
