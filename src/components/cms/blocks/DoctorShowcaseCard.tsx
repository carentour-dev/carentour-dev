"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import Image from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicLocale } from "@/i18n/routing";
import type { ClientDoctor } from "@/lib/doctors";
import { getDoctorInitials, pickDoctorImage } from "@/lib/doctors";
import { resolveGridImageLoading } from "@/lib/images/loading";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import { cn } from "@/lib/utils";

type DoctorShowcaseCardLabels = {
  featuredBadge: string;
  ratingLabel: string;
  reviewsSuffix: string;
  experience: string;
  experienceSuffix: string;
  procedures: string;
  publications: string;
  languages: string;
  education: string;
  viewProfile: string;
  primaryCta: string;
};

const getDefaultLabels = (locale: PublicLocale): DoctorShowcaseCardLabels =>
  locale === "ar"
    ? {
        featuredBadge: "أخصائي مميز",
        ratingLabel: "التقييم",
        reviewsSuffix: "مراجعات",
        experience: "الخبرة",
        experienceSuffix: "سنة",
        procedures: "الإجراءات",
        publications: "المنشورات",
        languages: "اللغات",
        education: "التعليم",
        viewProfile: "عرض الملف",
        primaryCta: "ابدأ رحلتك",
      }
    : {
        featuredBadge: "Featured specialist",
        ratingLabel: "rating",
        reviewsSuffix: "reviews",
        experience: "Experience",
        experienceSuffix: "years",
        procedures: "Procedures",
        publications: "Publications",
        languages: "Languages",
        education: "Education",
        viewProfile: "View profile",
        primaryCta: "Start your journey",
      };

export function DoctorShowcaseCard({
  doctor,
  locale = "en",
  index = 0,
  companyName,
  labels,
  className,
}: {
  doctor: ClientDoctor;
  locale?: PublicLocale;
  index?: number;
  companyName?: string;
  labels?: Partial<DoctorShowcaseCardLabels>;
  className?: string;
}) {
  const image = pickDoctorImage(doctor);
  const copy = { ...getDefaultLabels(locale), ...labels };
  const numberLocale = getPublicNumberLocale(locale);
  const integerFormatter = new Intl.NumberFormat(numberLocale);
  const ratingFormatter = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const hasFeaturedBadge = (doctor.patient_rating ?? 0) >= 4.8;
  const titleLength = doctor.title?.trim().length ?? 0;
  const titleClassName =
    titleLength > 22
      ? "text-[10px] leading-snug tracking-[0.08em]"
      : "text-xs tracking-[0.18em]";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[30px] border border-border/60 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <div className="grid md:grid-cols-[190px_1fr]">
        <div className="relative min-h-[250px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
          {image ? (
            <Image
              src={image}
              alt={doctor.name}
              fill
              loading={resolveGridImageLoading(index, {
                eagerCount: 2,
              })}
              sizes="(min-width: 1280px) 190px, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {hasFeaturedBadge ? (
              <Badge className="border-0 bg-background/90 text-foreground">
                {copy.featuredBadge}
              </Badge>
            ) : null}
          </div>
          <div
            className={cn(
              "absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-5 text-white backdrop-blur",
              image && "shadow-lg",
            )}
          >
            {!image ? (
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold">
                {getDoctorInitials(doctor.name)}
              </div>
            ) : null}
            <p
              className={cn(
                "max-w-full uppercase text-white/70",
                titleClassName,
              )}
            >
              {doctor.title}
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight">
              {doctor.name}
            </h3>
            <p className="mt-2 text-sm text-white/80">
              {doctor.specialization}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(doctor.patient_rating ?? 0) > 0 ? (
                <Badge
                  variant="outline"
                  className="border-amber-300/60 bg-amber-50 text-amber-900"
                >
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  {ratingFormatter.format(doctor.patient_rating)}{" "}
                  {copy.ratingLabel}
                </Badge>
              ) : null}
              {(doctor.total_reviews ?? 0) > 0 ? (
                <Badge variant="outline">
                  {integerFormatter.format(doctor.total_reviews)}{" "}
                  {copy.reviewsSuffix}
                </Badge>
              ) : null}
            </div>
            {companyName ? (
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {companyName}
              </p>
            ) : null}
          </div>

          {doctor.bio ? (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {doctor.bio}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 min-h-[6.75rem] flex-col rounded-2xl bg-muted/45 p-4">
              <p className="w-full text-left text-sm font-medium leading-none text-muted-foreground">
                {copy.experience}
              </p>
              <p className="mt-auto text-left text-base font-semibold text-foreground">
                {integerFormatter.format(doctor.experience_years)}{" "}
                {copy.experienceSuffix}
              </p>
            </div>
            <div className="flex min-w-0 min-h-[6.75rem] flex-col rounded-2xl bg-muted/45 p-4">
              <p className="w-full text-left text-sm font-medium leading-none text-muted-foreground">
                {copy.procedures}
              </p>
              <p className="mt-auto text-left text-base font-semibold text-foreground">
                {integerFormatter.format(doctor.successful_procedures ?? 0)}
              </p>
            </div>
            <div className="flex min-w-0 min-h-[6.75rem] flex-col rounded-2xl bg-muted/45 p-4">
              <p className="w-full text-left text-sm font-medium leading-none text-muted-foreground">
                {copy.publications}
              </p>
              <p className="mt-auto text-left text-base font-semibold text-foreground">
                {integerFormatter.format(doctor.research_publications ?? 0)}
              </p>
            </div>
            <div className="flex min-w-0 min-h-[6.75rem] flex-col rounded-2xl bg-muted/45 p-4">
              <p className="w-full text-left text-sm font-medium leading-none text-muted-foreground">
                {copy.languages}
              </p>
              <p className="mt-auto text-left text-base font-semibold text-foreground">
                {integerFormatter.format((doctor.languages ?? []).length)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {copy.education}
              </p>
              <p className="text-sm leading-6 text-foreground">
                {doctor.education}
              </p>
            </div>

            {(doctor.languages ?? []).length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {copy.languages}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(doctor.languages ?? []).slice(0, 6).map((entry) => (
                    <Badge key={entry} variant="secondary">
                      {entry}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="sm:flex-1">
              <Link
                href={localizePublicPathname(`/doctors/${doctor.id}`, locale)}
              >
                {copy.viewProfile}
              </Link>
            </Button>
            <Button asChild variant="outline" className="sm:flex-1">
              <Link
                href={`${localizePublicPathnameWithFallback("/start-journey", locale)}?doctor=${doctor.id}`}
              >
                {copy.primaryCta}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
