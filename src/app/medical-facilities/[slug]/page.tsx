import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pickFacilityImage } from "@/lib/medical-facilities";
import { fetchPublicServiceProviderBySlug } from "@/server/modules/serviceProviders/public";
import FacilityDetailClient from "./FacilityDetailClient";

type PageParams = {
  params: Promise<{ slug: string }>;
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

const toAbsoluteUrl = (src: string | null | undefined) => {
  if (!src) return undefined;
  if (src.startsWith("http")) return src;
  if (!baseUrl) return src;
  const needsSlash = !src.startsWith("/");
  return `${baseUrl}${needsSlash ? "/" : ""}${src}`;
};

export const generateMetadata = async ({
  params,
}: PageParams): Promise<Metadata> => {
  const { slug } = await params;
  const detail = await fetchPublicServiceProviderBySlug(slug);

  if (!detail) {
    return {
      title: "Medical facility not found",
      description: "The requested medical facility could not be located.",
    };
  }

  const { provider } = detail;
  const description =
    provider.overview ??
    provider.description ??
    "Explore details about this medical facility.";
  const image = pickFacilityImage(provider);
  const imageUrl = toAbsoluteUrl(image);
  const url = `${baseUrl}/medical-facilities/${provider.slug}`;

  return {
    title: `${provider.name} | Medical Facilities | Care N Tour`,
    description,
    alternates: {
      canonical: `/medical-facilities/${provider.slug}`,
    },
    openGraph: {
      title: provider.name,
      description,
      url: baseUrl ? url : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
};

export default async function MedicalFacilityDetailPage({
  params,
}: PageParams) {
  const { slug } = await params;
  const detail = await fetchPublicServiceProviderBySlug(slug);

  if (!detail) {
    notFound();
  }

  return <FacilityDetailClient slug={slug} initialData={detail} />;
}
