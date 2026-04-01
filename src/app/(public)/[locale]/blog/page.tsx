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
import BlogPageClient from "./BlogPageClient";

export const revalidate = 300;

const PATHNAME = "/blog";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const DEFAULTS = {
  title: "Health Insights & Travel Guides | Care N Tour Blog",
  description:
    "Read expert guidance, treatment explainers, and patient-focused medical travel articles.",
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

export default async function BlogPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(PATHNAME, locale);
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo(locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogPageClient />
    </>
  );
}
