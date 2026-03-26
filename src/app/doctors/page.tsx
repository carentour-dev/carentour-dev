import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import DoctorsPageClient from "./DoctorsPageClient";

export const revalidate = 300;

const PATHNAME = "/doctors";

const DEFAULTS = {
  title: "Our Doctors | Care N Tour",
  description:
    "Meet experienced specialist doctors supporting patient journeys with Care N Tour.",
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

export default async function DoctorsPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <DoctorsPageClient />
    </>
  );
}
