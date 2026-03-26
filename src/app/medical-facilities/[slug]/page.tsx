import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { pickFacilityImage } from "@/lib/medical-facilities";
import {
  maybeRedirectFromLegacyPath,
  medicalOrganizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { fetchPublicServiceProviderBySlug } from "@/server/modules/serviceProviders/public";
import FacilityDetailClient from "./FacilityDetailClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getSeo(
  slug: string,
  detail: Awaited<ReturnType<typeof fetchPublicServiceProviderBySlug>>,
) {
  const pathname = `/medical-facilities/${slug}`;
  const provider = detail?.provider;
  const defaultTitle = provider
    ? `${provider.name} | Medical Facilities | Care N Tour`
    : "Medical facility not found | Care N Tour";
  const defaultDescription =
    provider?.overview ??
    provider?.description ??
    "Explore details about this medical facility.";
  const image = provider ? pickFacilityImage(provider) : null;

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: provider
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: image,
        }
      : undefined,
    schema: provider
      ? [
          webPageSchema({
            urlPath: pathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
              { name: "Medical Facilities", path: "/medical-facilities" },
              { name: provider.name, path: pathname },
            ],
          }),
          medicalOrganizationSchema({
            path: pathname,
            name: provider.name,
            description: defaultDescription,
            imageUrl: image,
          }),
        ]
      : webPageSchema({
          urlPath: pathname,
          title: defaultTitle,
          description: defaultDescription,
        }),
    indexable: Boolean(provider),
    imageUrl: image,
    modifiedTime: provider?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await fetchPublicServiceProviderBySlug(slug);
  const seo = await getSeo(slug, detail);
  return seo.metadata;
}

export default async function MedicalFacilityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pathname = `/medical-facilities/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);

  const detail = await fetchPublicServiceProviderBySlug(slug);

  if (!detail) {
    notFound();
  }

  const seo = await getSeo(slug, detail);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <FacilityDetailClient slug={slug} initialData={detail} />
    </>
  );
}
