import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  maybeRedirectFromLegacyPath,
  medicalProcedureSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import TreatmentCategoryPageClient from "./TreatmentCategoryPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string }>;
};

async function getTreatmentBySlug(category: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select(
      "slug, name, summary, description, hero_image_url, card_image_url, is_active, is_listed_public, updated_at",
    )
    .eq("slug", category)
    .eq("is_active", true)
    .eq("is_listed_public", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load treatment for SEO", { category, error });
    return null;
  }

  return data;
}

async function getSeo(category: string) {
  const pathname = `/treatments/${category}`;
  const treatment = await getTreatmentBySlug(category);
  const defaultTitle = treatment
    ? `${treatment.name} | Treatments | Care N Tour`
    : "Treatment | Care N Tour";
  const defaultDescription =
    treatment?.summary ??
    treatment?.description ??
    "Learn more about this treatment option available through Care N Tour.";

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: treatment
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: treatment.hero_image_url ?? treatment.card_image_url,
        }
      : undefined,
    schema: treatment
      ? [
          webPageSchema({
            urlPath: pathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
              { name: "Treatments", path: "/treatments" },
              { name: treatment.name, path: pathname },
            ],
          }),
          medicalProcedureSchema({
            path: pathname,
            name: treatment.name,
            description: defaultDescription,
          }),
        ]
      : webPageSchema({
          urlPath: pathname,
          title: defaultTitle,
          description: defaultDescription,
        }),
    indexable: Boolean(treatment),
    modifiedTime: treatment?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const seo = await getSeo(category);
  return seo.metadata;
}

export default async function TreatmentCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const pathname = `/treatments/${category}`;

  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(category);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <TreatmentCategoryPageClient />
    </>
  );
}
