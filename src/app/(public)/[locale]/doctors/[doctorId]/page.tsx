import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import {
  assertPublicPageAvailable,
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
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
  params: Promise<{ locale: string; doctorId: string }>;
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
  locale: PublicLocale,
) {
  const pathname = `/doctors/${doctorId}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
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
    pathname: localizedPathname,
    locale,
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
            urlPath: localizedPathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
              {
                name: "Doctors",
                path: getLocalizedPublicPagePathname("/doctors", locale),
              },
              { name: doctor.name, path: localizedPathname },
            ],
          }),
          physicianSchema({
            path: localizedPathname,
            name: doctor.name,
            description: defaultDescription,
            imageUrl: doctor.avatar_url,
            specialty: doctor.specialization,
          }),
        ]
      : webPageSchema({
          urlPath: localizedPathname,
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
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/doctors/${doctorId}`, locale);
  const doctor = await getDoctorById(doctorId);
  const seo = await getSeo(doctorId, doctor, locale);
  return seo.metadata;
}

export default async function DoctorDetailsPage({ params }: PageProps) {
  const { doctorId } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/doctors/${doctorId}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);
  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    notFound();
  }

  const seo = await getSeo(doctorId, doctor, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <DoctorDetailsPageClient />
    </>
  );
}
