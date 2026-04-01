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
import StoriesPageClient from "./StoriesPageClient";

export const revalidate = 300;

const PATHNAME = "/stories";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const DEFAULTS = {
  title: "Patient Stories | Care N Tour",
  description:
    "Read real outcomes and treatment journeys from international patients.",
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

export default async function StoriesPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo(locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <StoriesPageClient />
    </>
  );
}
