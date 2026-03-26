import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import PlanPageClient from "./PlanPageClient";

export const revalidate = 300;

const PATHNAME = "/plan";

const DEFAULTS = {
  title: "Plan Your Trip | Care N Tour",
  description:
    "Explore the complete medical travel journey from consultation to recovery.",
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

export default async function PlanPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const seo = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <PlanPageClient />
    </>
  );
}
