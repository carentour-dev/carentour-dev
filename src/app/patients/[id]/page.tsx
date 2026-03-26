import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import PatientProfilePageClient from "./PatientProfilePageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

type PatientStorySeo = {
  headline: string | null;
  excerpt: string | null;
  hero_image: string | null;
  updated_at: string | null;
};

type PatientProfileSeo = {
  full_name: string;
  stories: PatientStorySeo[];
};

async function getPatientProfile(
  id: string,
): Promise<PatientProfileSeo | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_patient_testimonial", {
    p_patient_id: id,
  });

  if (error) {
    console.error("Failed to load patient profile for SEO", { id, error });
    return null;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const fullName =
    typeof payload.full_name === "string" && payload.full_name.trim().length > 0
      ? payload.full_name
      : "Patient";

  const stories = Array.isArray(payload.stories)
    ? payload.stories.map((item) => {
        const row =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Record<string, unknown>)
            : {};

        return {
          headline: typeof row.headline === "string" ? row.headline : null,
          excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
          hero_image:
            typeof row.hero_image === "string" ? row.hero_image : null,
          updated_at:
            typeof row.updated_at === "string" ? row.updated_at : null,
        } satisfies PatientStorySeo;
      })
    : [];

  return {
    full_name: fullName,
    stories,
  };
}

async function getSeo(id: string) {
  const pathname = `/patients/${id}`;
  const profile = await getPatientProfile(id);

  const firstStory = profile?.stories?.[0];
  const displayName = profile?.full_name ?? "Patient";
  const defaultTitle = profile
    ? `${displayName}'s Journey | Patient Story | Care N Tour`
    : "Patient Story | Care N Tour";
  const defaultDescription =
    firstStory?.excerpt ??
    (profile
      ? `Read ${displayName}'s medical tourism experience with Care N Tour.`
      : "Read a patient journey with Care N Tour.");

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: profile
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: firstStory?.hero_image,
        }
      : undefined,
    schema: webPageSchema({
      urlPath: pathname,
      title: defaultTitle,
      description: defaultDescription,
      breadcrumbs: [
        { name: "Patient Stories", path: "/stories" },
        { name: displayName, path: pathname },
      ],
    }),
    indexable: Boolean(profile),
    imageUrl: firstStory?.hero_image ?? undefined,
    modifiedTime: firstStory?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seo = await getSeo(id);
  return seo.metadata;
}

export default async function PatientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const pathname = `/patients/${id}`;

  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(id);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <PatientProfilePageClient />
    </>
  );
}
