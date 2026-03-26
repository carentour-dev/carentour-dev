import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import StartJourneyPageClient from "./StartJourneyPageClient";

export const revalidate = 300;

const PATHNAME = "/start-journey";

const DEFAULTS = {
  title: "Start Journey | Care N Tour",
  description:
    "Start your medical tourism journey with guided intake, documents, and scheduling.",
};

async function getSeo() {
  return resolveSeo({
    routeKey: PATHNAME,
    pathname: PATHNAME,
    defaults: DEFAULTS,
    schema: webPageSchema({
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

export default async function StartJourneyPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <StartJourneyPageClient />
    </>
  );
}
