import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import StoriesPageClient from "./StoriesPageClient";

export const revalidate = 300;

const PATHNAME = "/stories";

const DEFAULTS = {
  title: "Patient Stories | Care N Tour",
  description:
    "Read real outcomes and treatment journeys from international patients.",
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

export default async function StoriesPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <StoriesPageClient />
    </>
  );
}
