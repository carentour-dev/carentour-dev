"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DoctorReviews } from "@/components/DoctorReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Calendar,
  Users,
  Award,
  GraduationCap,
  Languages,
  FileText,
  ChevronLeft,
  MessageCircle,
} from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import type { LocalizedPublicDoctor } from "@/lib/doctors";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import type { LocalizedDoctorReview } from "@/server/modules/doctors/public";
import { localizePublicPathnameWithFallback } from "@/lib/public/routing";

type Props = {
  doctor: LocalizedPublicDoctor;
  reviews: LocalizedDoctorReview[];
  locale: PublicLocale;
};

export default function DoctorDetail({ doctor, reviews, locale }: Props) {
  const router = useRouter();
  const isArabicLocale = locale === "ar";
  const numberLocale = getPublicNumberLocale(locale);
  const integerFormatter = useMemo(
    () => new Intl.NumberFormat(numberLocale),
    [numberLocale],
  );
  const ratingFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [numberLocale],
  );
  const firstName = doctor.name.split(" ")[1] || doctor.name.split(" ")[0];
  const copy = {
    loading: isArabicLocale
      ? "جاري تحميل تفاصيل الطبيب..."
      : "Loading doctor details...",
    notFound: isArabicLocale ? "الطبيب غير موجود" : "Doctor not found",
    backToDoctors: isArabicLocale ? "العودة إلى الأطباء" : "Back to Doctors",
    reviewsLabel: isArabicLocale ? "مراجعة" : "reviews",
    yearsExperience: isArabicLocale ? "سنوات خبرة" : "years experience",
    procedures: isArabicLocale ? "إجراء" : "procedures",
    scheduleConsultation: isArabicLocale
      ? "احجز استشارة"
      : "Schedule Consultation",
    about: isArabicLocale
      ? `نبذة عن د. ${firstName}`
      : `About Dr. ${firstName}`,
    education: isArabicLocale ? "التعليم والتدريب" : "Education & Training",
    achievements: isArabicLocale
      ? "الإنجازات والجوائز"
      : "Achievements & Awards",
    certifications: isArabicLocale ? "الاعتمادات" : "Certifications",
    quickStats: isArabicLocale ? "إحصاءات سريعة" : "Quick Stats",
    experience: isArabicLocale ? "الخبرة" : "Experience",
    proceduresCount: isArabicLocale ? "الإجراءات" : "Procedures",
    publications: isArabicLocale ? "الأبحاث" : "Publications",
    patientRating: isArabicLocale ? "تقييم المرضى" : "Patient Rating",
    languages: isArabicLocale ? "اللغات" : "Languages",
    readyToSchedule: isArabicLocale ? "جاهز للحجز؟" : "Ready to Schedule?",
    readyDescription: isArabicLocale
      ? `احجز استشارة مع د. ${firstName} لمناقشة خيارات العلاج المناسبة لك.`
      : `Book a consultation with Dr. ${firstName} to discuss your treatment options.`,
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="border-b border-border bg-background py-4">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() =>
                router.push(
                  localizePublicPathnameWithFallback("/doctors", locale),
                )
              }
              className="mb-4"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {copy.backToDoctors}
            </Button>
          </div>
        </section>

        <section className="bg-surface-subtle py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col items-start gap-8 md:flex-row">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={doctor.avatar_url ?? undefined}
                    alt={doctor.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {doctor.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {doctor.specialization}
                  </Badge>
                  <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                    {doctor.name}
                  </h1>
                  <p className="mb-4 text-xl text-muted-foreground">
                    {doctor.title}
                  </p>

                  <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="font-semibold">
                        {ratingFormatter.format(doctor.patient_rating)}
                      </span>
                      <span className="text-muted-foreground">
                        ({integerFormatter.format(doctor.total_reviews)}{" "}
                        {copy.reviewsLabel})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {integerFormatter.format(doctor.experience_years)}{" "}
                        {copy.yearsExperience}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>
                        {integerFormatter.format(doctor.successful_procedures)}{" "}
                        {copy.procedures}
                      </span>
                    </div>
                  </div>

                  <Button size="lg" asChild>
                    <Link
                      href={localizePublicPathnameWithFallback(
                        "/consultation",
                        locale,
                      )}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {copy.scheduleConsultation}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                {doctor.bio ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {copy.about}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">
                        {doctor.bio}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {copy.education}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{doctor.education}</p>
                  </CardContent>
                </Card>

                {doctor.achievements?.length ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {copy.achievements}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {doctor.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                            <span className="text-muted-foreground">
                              {achievement}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}

                {doctor.certifications?.length ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.certifications}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {doctor.certifications.map((certification, index) => (
                          <Badge key={index} variant="secondary">
                            {certification}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {reviews.length > 0 ? (
                  <DoctorReviews reviews={reviews} locale={locale} />
                ) : null}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{copy.quickStats}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {copy.experience}
                      </span>
                      <span className="font-semibold">
                        {integerFormatter.format(doctor.experience_years)}{" "}
                        {isArabicLocale ? "سنة" : "years"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {copy.proceduresCount}
                      </span>
                      <span className="font-semibold">
                        {integerFormatter.format(doctor.successful_procedures)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {copy.publications}
                      </span>
                      <span className="font-semibold">
                        {integerFormatter.format(doctor.research_publications)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {copy.patientRating}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span className="font-semibold">
                          {ratingFormatter.format(doctor.patient_rating)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {doctor.languages?.length ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        {copy.languages}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {doctor.languages.map((language, index) => (
                          <Badge key={index} variant="outline">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="bg-surface-subtle">
                  <CardHeader>
                    <CardTitle>{copy.readyToSchedule}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {copy.readyDescription}
                    </p>
                    <Button className="w-full" size="lg" asChild>
                      <Link
                        href={localizePublicPathnameWithFallback(
                          "/consultation",
                          locale,
                        )}
                      >
                        {copy.scheduleConsultation}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
