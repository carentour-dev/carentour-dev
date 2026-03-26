import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import MedicalFacilitiesPageClient from "./MedicalFacilitiesPageClient";

export const revalidate = 300;

const PATHNAME = "/medical-facilities";

const DEFAULTS = {
  title: "Medical Facilities | Care N Tour",
  description: "Explore partner hospitals and medical facilities across Egypt.",
};

async function getSeo() {
  return resolveSeo({
    routeKey: PATHNAME,
    pathname: PATHNAME,
    defaults: DEFAULTS,
    schema: collectionPageSchema({
      urlPath: PATHNAME,
      title: DEFAULTS.title,
      description: DEFAULTS.description,
    }),
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return seo.metadata;
}

export default async function MedicalFacilitiesPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <MedicalFacilitiesPageClient />
    </>
  );
}
