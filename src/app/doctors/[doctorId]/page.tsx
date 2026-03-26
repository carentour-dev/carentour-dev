import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  maybeRedirectFromLegacyPath,
  physicianSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import DoctorDetailsPageClient from "./DoctorDetailsPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ doctorId: string }>;
};

async function getDoctorById(doctorId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("doctors")
    .select("id, name, specialization, bio, avatar_url, is_active, updated_at")
    .eq("id", doctorId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load doctor for SEO", { doctorId, error });
    return null;
  }

  return data;
}

async function getSeo(
  doctorId: string,
  doctor: Awaited<ReturnType<typeof getDoctorById>> | null,
) {
  const pathname = `/doctors/${doctorId}`;
  const defaultTitle = doctor
    ? `${doctor.name} | Doctors | Care N Tour`
    : "Doctor | Care N Tour";
  const defaultDescription =
    doctor?.bio ??
    (doctor?.specialization
      ? `${doctor.specialization} specialist at Care N Tour.`
      : "Meet one of our specialist doctors.");

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: doctor
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: doctor.avatar_url,
        }
      : undefined,
    schema: doctor
      ? [
          webPageSchema({
            urlPath: pathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
              { name: "Doctors", path: "/doctors" },
              { name: doctor.name, path: pathname },
            ],
          }),
          physicianSchema({
            path: pathname,
            name: doctor.name,
            description: defaultDescription,
            imageUrl: doctor.avatar_url,
            specialty: doctor.specialization,
          }),
        ]
      : webPageSchema({
          urlPath: pathname,
          title: defaultTitle,
          description: defaultDescription,
        }),
    indexable: Boolean(doctor),
    modifiedTime: doctor?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { doctorId } = await params;
  const doctor = await getDoctorById(doctorId);
  const seo = await getSeo(doctorId, doctor);
  return seo.metadata;
}

export default async function DoctorDetailsPage({ params }: PageProps) {
  const { doctorId } = await params;
  const pathname = `/doctors/${doctorId}`;

  await maybeRedirectFromLegacyPath(pathname);
  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    notFound();
  }

  const seo = await getSeo(doctorId, doctor);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <DoctorDetailsPageClient />
    </>
  );
}
