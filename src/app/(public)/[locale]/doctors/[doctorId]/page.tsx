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
import {
  fetchLocalizedDoctorReviews,
  fetchLocalizedPublicDoctorById,
} from "@/server/modules/doctors/public";
import DoctorDetailsPageClient from "./DoctorDetailsPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; doctorId: string }>;
};

async function getSeo(doctorId: string, locale: PublicLocale) {
  const doctor = await fetchLocalizedPublicDoctorById(locale, doctorId);
  const pathname = `/doctors/${doctorId}`;
  const localizedPathname = getLocalizedPublicPagePathname(pathname, locale);
  const doctorsLabel = locale === "ar" ? "الأطباء" : "Doctors";
  const defaultTitle = doctor
    ? locale === "ar"
      ? `${doctor.name} | الأطباء | كير آند تور`
      : `${doctor.name} | Doctors | Care N Tour`
    : locale === "ar"
      ? "طبيب | كير آند تور"
      : "Doctor | Care N Tour";
  const defaultDescription =
    doctor?.bio ??
    (doctor?.specialization
      ? locale === "ar"
        ? `${doctor.specialization} مع كير آند تور.`
        : `${doctor.specialization} specialist at Care N Tour.`
      : locale === "ar"
        ? "تعرّف على أحد أطبائنا المتخصصين."
        : "Meet one of our specialist doctors.");

  return {
    doctor,
    seo: await resolveSeo({
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
                  name: doctorsLabel,
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
    }),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { doctorId } = await params;
  const locale = await getPublicLocaleFromParams(params);
  await assertPublicPageAvailable(`/doctors/${doctorId}`, locale);
  const { seo } = await getSeo(doctorId, locale);
  return seo.metadata;
}

export default async function DoctorDetailsPage({ params }: PageProps) {
  const { doctorId } = await params;
  const locale = await getPublicLocaleFromParams(params);
  const pathname = `/doctors/${doctorId}`;

  await assertPublicPageAvailable(pathname, locale);
  await maybeRedirectFromLegacyPath(pathname);
  const [{ doctor, seo }, reviews] = await Promise.all([
    getSeo(doctorId, locale),
    fetchLocalizedDoctorReviews(doctorId, locale),
  ]);

  if (!doctor) {
    notFound();
  }

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <DoctorDetailsPageClient
        doctor={doctor}
        reviews={reviews}
        locale={locale}
      />
    </>
  );
}
