"use client";

import { useCallback, useMemo, type ComponentType } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoctorProfile } from "@/components/DoctorProfile";
import { DoctorReviews } from "@/components/DoctorReviews";
import PriceComparison from "@/components/PriceComparison";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatientReviews, usePatientStories } from "@/hooks/useTestimonials";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import {
  selectPrimaryProcedure,
  type NormalizedTreatment,
} from "@/lib/treatments";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  Star,
  Check,
  Users,
  Heart,
  CheckCircle,
  Loader2,
  FileDown,
} from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import { localizeCompanyNameDeep } from "@/lib/public/brand";
import { getPublicNumberLocale } from "@/lib/public/numbers";

const isRemoteImageUrl = (value: string) => /^https?:\/\//.test(value);

export default function TreatmentDetails({
  treatment: normalizedTreatment,
  locale,
  slug,
}: {
  treatment: NormalizedTreatment;
  locale: PublicLocale;
  slug: string;
}) {
  const router = useRouter();
  const isArabicLocale = locale === "ar";
  const numberLocale = getPublicNumberLocale(locale);
  const treatmentsHref = localizePublicPathname("/treatments", locale);
  const startJourneyHref = localizePublicPathnameWithFallback(
    "/start-journey",
    locale,
  );
  const consultationHref = localizePublicPathnameWithFallback(
    "/consultation",
    locale,
  );
  const localizedTreatment = useMemo(
    () => localizeCompanyNameDeep(normalizedTreatment, locale),
    [locale, normalizedTreatment],
  );

  const formatCurrency = (value: number, currency?: string | null) => {
    try {
      return new Intl.NumberFormat(numberLocale, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(value);
    } catch (error) {
      return `$${new Intl.NumberFormat(numberLocale).format(value)}`;
    }
  };
  const formatDayCount = useCallback(
    (value: number) => {
      const formattedValue = new Intl.NumberFormat(numberLocale).format(value);

      return isArabicLocale
        ? `${formattedValue} يوم`
        : `${formattedValue} day${value === 1 ? "" : "s"}`;
    },
    [isArabicLocale, numberLocale],
  );
  const copy = {
    backToAllTreatments: isArabicLocale
      ? "العودة إلى جميع العلاجات"
      : "Back to All Treatments",
    heroImageAlt: isArabicLocale
      ? (title: string) => `صورة الغلاف الخاصة بعلاج ${title}`
      : (title: string) => `${title} cover image`,
    fallbackDescription: isArabicLocale
      ? "تعرّف على هذا العلاج المتاح عبر كير آند تور."
      : "Learn more about this treatment option available through Care N Tour.",
    fallbackOverview: isArabicLocale
      ? "يضع خبراؤنا الطبيون خططاً علاجية فردية تجمع بين أفضل الأطباء والمنشآت الطبية."
      : "Our medical experts craft individualized treatment plans combining top specialists and service providers.",
    overviewHeading: isArabicLocale
      ? "نظرة عامة على العلاج"
      : "Treatment Overview",
    idealCandidatesHeading: isArabicLocale
      ? "المرشحون المناسبون"
      : "Ideal Candidates",
    candidateSuitability: isArabicLocale
      ? "يتم تأكيد ملاءمة الحالة خلال الاستشارة لضمان توافق العلاج مع وضعك الصحي."
      : "Candidate suitability is confirmed during your consultation to ensure the treatment matches your health profile.",
    quickFactsHeading: isArabicLocale ? "معلومات سريعة" : "Quick Facts",
    treatmentDuration: isArabicLocale ? "مدة العلاج" : "Treatment duration",
    recoveryTimeline: isArabicLocale ? "فترة التعافي" : "Recovery timeline",
    estimatedCost: isArabicLocale ? "التكلفة التقديرية" : "Estimated cost",
    successRate: isArabicLocale ? "نسبة النجاح" : "Success rate",
    treatmentPdf: isArabicLocale ? "ملف العلاج" : "Treatment PDF",
    downloadOverview: isArabicLocale ? "تنزيل الملخص" : "Download overview",
    personalizedConsultation: isArabicLocale
      ? "استشارة مخصصة"
      : "Personalized consultation",
    personalizedConsultationDescription: isArabicLocale
      ? "يحدد منسقونا الطبيون الأسعار والمدة وفترة التعافي بناءً على حالتك الفردية."
      : "Our medical coordinators finalize pricing, duration, and recovery timelines based on your unique case.",
    proceduresHeading: isArabicLocale
      ? "الإجراءات المتاحة"
      : "Available Procedures",
    proceduresDescription: isArabicLocale
      ? "معلومات شاملة عن كل إجراء، بما في ذلك التعافي ومتطلبات الترشح."
      : "Comprehensive information about each procedure including recovery details and candidate requirements",
    durationLabel: isArabicLocale ? "المدة" : "Duration",
    recoveryLabel: isArabicLocale ? "التعافي" : "Recovery",
    priceLabel: isArabicLocale ? "السعر" : "Price",
    procedurePdf: isArabicLocale ? "ملف الإجراء" : "Procedure PDF",
    procedurePdfDescription: isArabicLocale
      ? "نزّل نظرة عامة مفصلة لهذا الإجراء."
      : "Download a detailed overview for this procedure.",
    download: isArabicLocale ? "تنزيل" : "Download",
    candidateRequirements: isArabicLocale
      ? "متطلبات الترشح"
      : "Candidate Requirements",
    additionalNotes: isArabicLocale ? "ملاحظات إضافية" : "Additional Notes",
    recoveryTimelineHeading: isArabicLocale
      ? "الجدول الزمني للتعافي"
      : "Recovery Timeline",
    startJourney: isArabicLocale ? "ابدأ رحلتك" : "Start Your Journey",
    noProcedureInfo: isArabicLocale
      ? "سيتم تزويدك بالتفاصيل الكاملة للإجراءات أثناء الاستشارة."
      : "Detailed procedure information for this treatment will be provided during your consultation.",
    specialistsHeading: isArabicLocale
      ? "أطباؤنا المتخصصون"
      : "Our Specialist Doctors",
    specialistsDescription: isArabicLocale
      ? "تعرّف على أطبائنا المدربين دولياً الذين يجمعون بين الخبرة الطويلة والتقنيات الحديثة لتحقيق أفضل النتائج."
      : "Meet our internationally trained specialists who combine years of experience with cutting-edge techniques to deliver exceptional results.",
    noSpecialists: isArabicLocale
      ? "لم يتم العثور على متخصصين لهذا العلاج حالياً."
      : "No specialists found for this treatment category.",
    internationalLabel: isArabicLocale ? "دولي" : "International",
    patientReviewsHeading: isArabicLocale ? "آراء المرضى" : "Patient Reviews",
    patientReviewsEmpty: isArabicLocale
      ? "ستظهر آراء المرضى لهذا العلاج هنا فور نشر قصصهم."
      : "Testimonials for this treatment will appear here as soon as patients publish their stories.",
    patientStoriesHeading: isArabicLocale ? "قصص المرضى" : "Patient Stories",
    patientStoriesDescription: isArabicLocale
      ? "تابع رحلات المرضى الذين سافروا مع كير آند تور لهذا العلاج."
      : "Follow the journeys of patients who travelled with Care N Tour for this treatment.",
    featuredSuccess: isArabicLocale ? "قصة نجاح مميزة" : "Featured success",
    noPatientStories: isArabicLocale
      ? "لا توجد قصص مرضى منشورة بعد. تحقق لاحقاً للاطلاع على التجارب الواقعية."
      : "No patient stories published yet. Check back soon for real-case journeys.",
    ctaHeading: isArabicLocale
      ? (title: string) => `هل أنت جاهز لبدء رحلة ${title}؟`
      : (title: string) => `Ready to Start Your ${title} Journey?`,
    ctaDescription: isArabicLocale
      ? "احصل على خطة علاج مخصصة وتقدير للتكلفة من خبرائنا الطبيين."
      : "Get a personalized treatment plan and cost estimate from our medical experts",
    scheduleConsultation: isArabicLocale
      ? "احجز استشارة"
      : "Schedule Consultation",
  };

  const treatmentId = localizedTreatment.id;
  const treatmentSlugValue = localizedTreatment.slug;

  const rawDoctorCategory = localizedTreatment?.category ?? undefined;
  const doctorCategorySlug = rawDoctorCategory
    ? rawDoctorCategory.trim().toLowerCase()
    : undefined;

  const { doctors, loading: doctorsLoading } = useDoctors(doctorCategorySlug, {
    locale,
  });
  const { reviews: patientReviews, loading: patientReviewsLoading } =
    usePatientReviews({
      treatmentId,
      treatmentSlug: treatmentSlugValue,
    });
  const { stories: patientStories, loading: patientStoriesLoading } =
    usePatientStories({
      treatmentId,
      treatmentSlug: treatmentSlugValue,
    });

  const treatment = useMemo(
    () => ({
      title: localizedTreatment.name,
      description:
        localizedTreatment.summary ||
        localizedTreatment.description ||
        copy.fallbackDescription,
      heroImage:
        localizedTreatment.heroImageUrl ??
        localizedTreatment.cardImageUrl ??
        null,
      overview:
        localizedTreatment.overview ||
        localizedTreatment.description ||
        copy.fallbackOverview,
      idealCandidates: localizedTreatment.idealCandidates,
      procedures: localizedTreatment.procedures,
      downloadUrl: localizedTreatment.downloadUrl ?? null,
      quickFacts: {
        duration: localizedTreatment.durationDays,
        recovery: localizedTreatment.recoveryTimeDays,
        price: localizedTreatment.basePrice,
        currency: localizedTreatment.currency,
        successRate: localizedTreatment.successRate,
      },
    }),
    [copy.fallbackDescription, copy.fallbackOverview, localizedTreatment],
  );

  const quickFacts = useMemo(() => {
    if (localizedTreatment) {
      const primaryProcedure = selectPrimaryProcedure(
        localizedTreatment.procedures,
      );

      const fallbackDuration =
        typeof primaryProcedure?.duration === "string"
          ? primaryProcedure.duration.trim()
          : "";
      const durationLabel = localizedTreatment.durationDays
        ? formatDayCount(localizedTreatment.durationDays)
        : fallbackDuration || undefined;

      const fallbackRecovery =
        typeof primaryProcedure?.recovery === "string"
          ? primaryProcedure.recovery.trim()
          : "";
      const recoveryLabel = localizedTreatment.recoveryTimeDays
        ? formatDayCount(localizedTreatment.recoveryTimeDays)
        : fallbackRecovery || undefined;

      const priceValue =
        localizedTreatment.basePrice ??
        primaryProcedure?.egyptPrice ??
        undefined;

      const fallbackSuccess =
        typeof primaryProcedure?.successRate === "string"
          ? primaryProcedure.successRate.trim()
          : "";
      const successRateLabel =
        localizedTreatment.successRate !== undefined &&
        localizedTreatment.successRate !== null
          ? `${localizedTreatment.successRate}%`
          : fallbackSuccess || undefined;

      return {
        durationLabel,
        recoveryLabel,
        priceValue,
        currency: localizedTreatment.currency ?? "USD",
        successRateLabel,
      };
    }

    return null;
  }, [formatDayCount, localizedTreatment]);

  const quickFactsHasContent =
    !!quickFacts &&
    Boolean(
      quickFacts.durationLabel ||
        quickFacts.recoveryLabel ||
        (typeof quickFacts.priceValue === "number" &&
          !Number.isNaN(quickFacts.priceValue)) ||
        quickFacts.successRateLabel,
    );
  const hasQuickFacts = quickFactsHasContent || Boolean(treatment?.downloadUrl);

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Breadcrumb Navigation */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <button
              onClick={() => router.push(treatmentsHref)}
              className="flex items-center text-primary hover:text-primary/80 transition-colors mb-6"
            >
              {isArabicLocale ? (
                <ArrowRight className="ml-2 h-4 w-4" />
              ) : (
                <ArrowLeft className="mr-2 h-4 w-4" />
              )}
              {copy.backToAllTreatments}
            </button>

            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4">
                {treatment.title}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {treatment.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {treatment.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-4" />
            </div>
          </div>
        </section>

        {treatment.heroImage ? (
          <section className="pt-6 pb-4 bg-background">
            <div className="container mx-auto px-4">
              <div className="relative aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/5] overflow-hidden rounded-2xl border border-border/60">
                <Image
                  src={treatment.heroImage}
                  alt={copy.heroImageAlt(treatment.title)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
                  unoptimized={isRemoteImageUrl(treatment.heroImage)}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Treatment Overview */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  {copy.overviewHeading}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {treatment.overview}
                </p>

                <div className="bg-surface-subtle rounded-lg border border-border/50 p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {copy.idealCandidatesHeading}
                  </h3>
                  {treatment.idealCandidates.length > 0 ? (
                    <ul className="space-y-3">
                      {treatment.idealCandidates.map(
                        (candidate: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {candidate}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {copy.candidateSuitability}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Card className="border-primary/20 bg-surface-subtle">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">
                      {copy.quickFactsHeading}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quickFacts?.durationLabel ? (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.treatmentDuration}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.durationLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {quickFacts?.recoveryLabel ? (
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.recoveryTimeline}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.recoveryLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {typeof quickFacts?.priceValue === "number" ? (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.estimatedCost}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(
                              quickFacts.priceValue,
                              quickFacts.currency,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {quickFacts?.successRateLabel ? (
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.successRate}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.successRateLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {treatment?.downloadUrl ? (
                      <div className="flex items-center gap-3">
                        <FileDown className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.treatmentPdf}
                          </div>
                          <a
                            href={treatment.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {copy.downloadOverview}
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {!hasQuickFacts && (
                      <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground">
                            {copy.personalizedConsultation}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {copy.personalizedConsultationDescription}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Procedures Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {copy.proceduresHeading}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {copy.proceduresDescription}
              </p>
            </div>

            <div className="space-y-12">
              {treatment.procedures && treatment.procedures.length > 0 ? (
                treatment.procedures.map((procedure, index) => {
                  const detailItems: {
                    label: string;
                    value: string | undefined;
                    icon: ComponentType<{ className?: string }>;
                  }[] = [
                    {
                      label: copy.durationLabel,
                      value: procedure.duration?.trim(),
                      icon: Clock,
                    },
                    {
                      label: copy.recoveryLabel,
                      value: procedure.recovery?.trim(),
                      icon: Heart,
                    },
                    {
                      label: copy.priceLabel,
                      value: procedure.price?.trim(),
                      icon: DollarSign,
                    },
                    {
                      label: copy.successRate,
                      value: procedure.successRate?.trim(),
                      icon: Star,
                    },
                  ];
                  const visibleDetails = detailItems.filter(
                    (
                      detail,
                    ): detail is {
                      label: string;
                      value: string;
                      icon: ComponentType<{ className?: string }>;
                    } => Boolean(detail.value),
                  );
                  const hasProcedureSummary =
                    visibleDetails.length > 0 || Boolean(procedure.pdfUrl);
                  const hasCandidateRequirements =
                    Array.isArray(procedure.candidateRequirements) &&
                    procedure.candidateRequirements.length > 0;

                  return (
                    <Card
                      key={index}
                      className="border-border/50 hover:shadow-card-hover transition-spring"
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl">
                          {procedure.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-lg">
                          {procedure.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {hasProcedureSummary ? (
                          <div className="mb-8 space-y-6">
                            {visibleDetails.length > 0 ? (
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {visibleDetails.map((detail) => {
                                  const Icon = detail.icon;
                                  return (
                                    <div
                                      key={detail.label}
                                      className="text-center p-4 bg-muted/50 rounded-lg"
                                    >
                                      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                                      <div className="text-sm font-medium text-foreground">
                                        {detail.label}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {detail.value}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            {procedure.pdfUrl ? (
                              <div className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <FileDown className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      {copy.procedurePdf}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {copy.procedurePdfDescription}
                                    </p>
                                  </div>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={procedure.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {copy.download}
                                  </a>
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {/* Candidate Requirements */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            {copy.candidateRequirements}
                          </h4>
                          {hasCandidateRequirements ? (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {procedure.candidateRequirements.map(
                                (req: string, reqIndex: number) => (
                                  <li
                                    key={reqIndex}
                                    className="flex items-start gap-2"
                                  >
                                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                      {req}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {copy.candidateSuitability}
                            </p>
                          )}
                        </div>

                        {/* Additional Notes */}
                        {procedure.additionalNotes ? (
                          <div className="mb-8 rounded-lg border border-border/60 bg-muted/40 p-4 text-start">
                            <h4 className="text-lg font-semibold text-foreground">
                              {copy.additionalNotes}
                            </h4>
                            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                              {procedure.additionalNotes}
                            </p>
                          </div>
                        ) : null}

                        {/* Recovery Timeline */}
                        {procedure.recoveryStages &&
                        procedure.recoveryStages.length > 0 ? (
                          <div className="mb-8">
                            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Clock className="h-5 w-5 text-primary" />
                              {copy.recoveryTimelineHeading}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {procedure.recoveryStages.map(
                                (stage: any, stageIndex: number) => (
                                  <div
                                    key={stageIndex}
                                    className="p-4 border border-border rounded-lg"
                                  >
                                    <div className="text-sm font-medium text-primary mb-2">
                                      {stage.stage}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {stage.description}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Price Comparison */}
                        {procedure.internationalPrices &&
                        procedure.internationalPrices.length > 0 &&
                        procedure.egyptPrice ? (
                          <div className="mb-8">
                            <PriceComparison
                              treatment={procedure.name}
                              egyptPrice={procedure.egyptPrice}
                              egyptCurrency={
                                localizedTreatment.currency ?? "USD"
                              }
                              internationalPrices={
                                procedure.internationalPrices
                              }
                            />
                          </div>
                        ) : null}

                        {/* Start Your Journey CTA */}
                        <div className="mt-8 pt-6 border-t border-border/50">
                          <Button
                            className="w-full"
                            onClick={() => {
                              const params = new URLSearchParams({
                                treatment: slug,
                                procedure: procedure.id,
                              });
                              router.push(
                                `${startJourneyHref}?${params.toString()}`,
                              );
                            }}
                          >
                            {copy.startJourney}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground">
                  {copy.noProcedureInfo}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Specialist Doctors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {copy.specialistsHeading}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {copy.specialistsDescription}
              </p>
            </div>

            {doctorsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {doctors.map((doctor) => (
                  <DoctorProfile
                    key={doctor.id}
                    doctor={doctor}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{copy.noSpecialists}</p>
              </div>
            )}
          </div>
        </section>

        {/* Patient Reviews */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            {patientReviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientReviews.length > 0 ? (
              <DoctorReviews
                reviews={patientReviews.map((review) => ({
                  ...review,
                  patient_country:
                    review.patient_country ?? copy.internationalLabel,
                  procedure_name: review.procedure_name ?? undefined,
                  recovery_time: review.recovery_time ?? "",
                  is_verified: true,
                }))}
              />
            ) : (
              <div className="text-center py-16">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {copy.patientReviewsHeading}
                </h3>
                <p className="text-muted-foreground">
                  {copy.patientReviewsEmpty}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Patient Stories */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {copy.patientStoriesHeading}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {copy.patientStoriesDescription}
              </p>
            </div>

            {patientStoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientStories.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {patientStories.map((story) => (
                  <Card key={story.id} className="border-border/50 shadow-sm">
                    <CardHeader>
                      <Badge
                        variant="secondary"
                        className="w-fit mb-2 uppercase tracking-wide"
                      >
                        {story.locale?.toUpperCase() ?? "EN"}
                      </Badge>
                      <CardTitle className="text-2xl text-foreground">
                        {story.headline}
                      </CardTitle>
                      {story.excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {story.excerpt}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                        {story.body_markdown.replace(/[#*_`>/]/g, "")}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        {story.featured && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                            {copy.featuredSuccess}
                          </span>
                        )}
                        <span>
                          {new Date(story.created_at).toLocaleDateString(
                            isArabicLocale ? "ar-EG" : "en-US",
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                {copy.noPatientStories}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-surface-brand py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              {copy.ctaHeading(treatment.title)}
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              {copy.ctaDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="premium"
                onClick={() =>
                  router.push(`${startJourneyHref}?treatment=${slug}`)
                }
              >
                {copy.startJourney}
              </Button>
              <Button
                size="lg"
                variant="hero"
                onClick={() => router.push(consultationHref)}
              >
                {copy.scheduleConsultation}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
