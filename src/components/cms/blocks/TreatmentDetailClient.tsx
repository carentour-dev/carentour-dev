"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import Image from "@/components/OptimizedImage";
import { DoctorReviews } from "@/components/DoctorReviews";
import PriceComparison from "@/components/PriceComparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FilterComboBox,
  type FilterComboBoxOption,
} from "@/components/ui/filter-combobox";
import { Input } from "@/components/ui/input";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatientReviews, usePatientStories } from "@/hooks/useTestimonials";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { resolveHeroImageLoading } from "@/lib/images/loading";
import {
  getPublicNumberLocale,
  localizeOptionalDigits,
} from "@/lib/public/numbers";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import {
  getLocalizedCompanyName,
  localizeCompanyNameDeep,
} from "@/lib/public/brand";
import { buildTreatmentProcedureDirectoryState } from "@/lib/treatment-procedure-directory";
import {
  selectPrimaryProcedure,
  type NormalizedTreatment,
  type TreatmentProcedure,
} from "@/lib/treatments";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileDown,
  Heart,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { DoctorShowcaseCard } from "./DoctorShowcaseCard";

type Props = {
  block: BlockInstance<"treatmentDetail">;
  treatment: NormalizedTreatment;
  slug: string;
  locale: PublicLocale;
  treatmentOptions?: Array<{
    slug: string;
    name: string;
  }>;
  disableAncillaryFetch?: boolean;
};

const ALL_OPTION_VALUE = "__all__";

const truncateText = (value: string | null | undefined, limit = 180) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit).trimEnd()}...`;
};

const buildFilterOptions = (
  entries: Array<{ value: string; label: string }>,
  allLabel: string,
): FilterComboBoxOption[] => [
  {
    value: ALL_OPTION_VALUE,
    label: allLabel,
    searchTerms: [allLabel],
  },
  ...entries.map((entry) => ({
    value: entry.value,
    label: entry.label,
    searchTerms: [entry.label],
  })),
];

const getLocalizedText = (
  value: string | null | undefined,
  locale: PublicLocale,
) => localizeOptionalDigits(value, locale) ?? value ?? "";

function TreatmentProcedureCard({
  procedure,
  block,
  locale,
  slug,
  currency,
  numberLocale,
}: {
  procedure: TreatmentProcedure;
  block: BlockInstance<"treatmentDetail">;
  locale: PublicLocale;
  slug: string;
  currency?: string | null;
  numberLocale: string;
}) {
  const [priceComparisonOpen, setPriceComparisonOpen] = useState(false);
  const startJourneyHref = localizePublicPathnameWithFallback(
    "/start-journey",
    locale,
  );
  const localizedProcedureName = getLocalizedText(procedure.name, locale);
  const localizedProcedureDescription = localizeOptionalDigits(
    procedure.description,
    locale,
  );

  const detailItems = [
    {
      label: block.procedureLabels.duration,
      value: localizeOptionalDigits(procedure.duration?.trim(), locale),
      icon: Clock,
    },
    {
      label: block.procedureLabels.recovery,
      value: localizeOptionalDigits(procedure.recovery?.trim(), locale),
      icon: Heart,
    },
    {
      label: block.procedureLabels.price,
      value: localizeOptionalDigits(procedure.price?.trim(), locale),
      icon: DollarSign,
    },
    {
      label: block.procedureLabels.successRate,
      value: localizeOptionalDigits(procedure.successRate?.trim(), locale),
      icon: Star,
    },
  ].filter(
    (
      detail,
    ): detail is {
      label: string;
      value: string;
      icon: typeof Clock;
    } => Boolean(detail.value),
  );

  const hasProcedureSummary =
    detailItems.length > 0 || Boolean(procedure.pdfUrl?.trim());
  const hasCandidateRequirements = procedure.candidateRequirements.length > 0;
  const hasPriceComparison =
    typeof procedure.egyptPrice === "number" &&
    procedure.internationalPrices.length > 0;
  const startJourneySearch = new URLSearchParams({
    treatment: slug,
    procedure: procedure.id,
  }).toString();

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition hover:shadow-lg">
      <CardHeader className="space-y-4 border-b border-border/40 bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-foreground">
              {localizedProcedureName}
            </CardTitle>
            {localizedProcedureDescription ? (
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {localizedProcedureDescription}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {procedure.pdfUrl ? (
              <Badge variant="outline">
                {block.filterOptionLabels.resourcesGuide}
              </Badge>
            ) : null}
            {hasCandidateRequirements ? (
              <Badge variant="outline">
                {block.filterOptionLabels.resourcesRequirements}
              </Badge>
            ) : null}
            {hasPriceComparison ? (
              <Badge variant="secondary">
                {block.filterOptionLabels.pricingComparison}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6">
        {hasProcedureSummary ? (
          <div className="space-y-6">
            {detailItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {detailItems.map((detail) => {
                  const Icon = detail.icon;

                  return (
                    <div
                      key={detail.label}
                      className="rounded-2xl border border-border/60 bg-card/70 p-4 text-center"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {detail.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {detail.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {procedure.pdfUrl ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileDown className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {block.procedureLabels.procedurePdf}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {block.procedureLabels.procedurePdfDescription}
                    </p>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm">
                  <a href={procedure.pdfUrl} target="_blank" rel="noreferrer">
                    {block.procedureLabels.download}
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasPriceComparison ? (
          <Collapsible
            open={priceComparisonOpen}
            onOpenChange={setPriceComparisonOpen}
            className="rounded-2xl border border-border/60 bg-muted/20 p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {block.procedureLabels.priceComparisonToggle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {typeof procedure.egyptPrice === "number"
                    ? new Intl.NumberFormat(numberLocale, {
                        style: "currency",
                        currency: currency || "USD",
                        maximumFractionDigits: 0,
                      }).format(procedure.egyptPrice)
                    : block.filterOptionLabels.pricingGuidance}
                </p>
              </div>

              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {priceComparisonOpen
                    ? block.procedureLabels.priceComparisonHide
                    : block.procedureLabels.priceComparisonShow}
                  {priceComparisonOpen ? (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="pt-4">
              <PriceComparison
                treatment={localizedProcedureName}
                egyptPrice={procedure.egyptPrice!}
                egyptCurrency={currency ?? "USD"}
                internationalPrices={procedure.internationalPrices}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              {block.procedureLabels.candidateRequirements}
            </h4>
            {hasCandidateRequirements ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {procedure.candidateRequirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-muted-foreground">
                      {getLocalizedText(requirement, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {block.labels.candidateSuitability}
              </p>
            )}
          </div>

          {procedure.additionalNotes ? (
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
              <h4 className="text-lg font-semibold text-foreground">
                {block.procedureLabels.additionalNotes}
              </h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {localizeOptionalDigits(procedure.additionalNotes, locale)}
              </p>
            </div>
          ) : null}
        </div>

        {procedure.recoveryStages.length > 0 ? (
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              {block.procedureLabels.recoveryTimeline}
            </h4>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {procedure.recoveryStages.map((stage) => (
                <div
                  key={`${procedure.id}-${stage.stage}`}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4"
                >
                  <p className="text-sm font-semibold text-primary">
                    {getLocalizedText(stage.stage, locale)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {getLocalizedText(stage.description, locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-border/50 pt-6">
          <Button asChild className="w-full sm:w-auto">
            <Link href={`${startJourneyHref}?${startJourneySearch}`}>
              {block.procedureLabels.startJourney}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TreatmentDetailClient({
  block,
  treatment: normalizedTreatment,
  slug,
  locale,
  treatmentOptions = [],
  disableAncillaryFetch = false,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const deferredSearch = useDeferredValue(search);
  const isArabicLocale = locale === "ar";
  const numberLocale = getPublicNumberLocale(locale);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(numberLocale),
    [numberLocale],
  );
  const treatmentsHref = localizePublicPathname("/treatments", locale);
  const consultationHref = localizePublicPathnameWithFallback(
    "/consultation",
    locale,
  );
  const companyName = getLocalizedCompanyName(locale);
  const localizedTreatment = useMemo(
    () => localizeCompanyNameDeep(normalizedTreatment, locale),
    [locale, normalizedTreatment],
  );
  const resolvedTreatmentOptions = useMemo(() => {
    const options = new Map(
      treatmentOptions.map((option) => [option.slug, option] as const),
    );

    if (!options.has(localizedTreatment.slug)) {
      options.set(localizedTreatment.slug, {
        slug: localizedTreatment.slug,
        name: localizedTreatment.name,
      });
    }

    return Array.from(options.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [localizedTreatment.name, localizedTreatment.slug, treatmentOptions]);
  const treatmentComboOptions = useMemo(
    () =>
      buildFilterOptions(
        resolvedTreatmentOptions.map((option) => ({
          value: option.slug,
          label: getLocalizedText(option.name, locale),
        })),
        block.filterPlaceholders.treatment,
      ),
    [block.filterPlaceholders.treatment, locale, resolvedTreatmentOptions],
  );
  const procedureOptions = useMemo(
    () =>
      buildFilterOptions(
        localizedTreatment.procedures.map((procedure) => ({
          value: procedure.id,
          label: getLocalizedText(procedure.name, locale),
        })),
        block.filterPlaceholders.procedure,
      ),
    [block.filterPlaceholders.procedure, locale, localizedTreatment.procedures],
  );

  const procedureDirectoryState = useMemo(
    () =>
      buildTreatmentProcedureDirectoryState({
        treatment: localizedTreatment,
        filters: {
          search: deferredSearch,
          procedureId,
        },
      }),
    [deferredSearch, localizedTreatment, procedureId],
  );

  const treatmentId = localizedTreatment.id;
  const rawDoctorCategory = localizedTreatment.category ?? undefined;
  const doctorCategorySlug = rawDoctorCategory
    ? rawDoctorCategory.trim().toLowerCase()
    : undefined;
  const { doctors, loading: doctorsLoading } = useDoctors(doctorCategorySlug, {
    locale,
    enabled: !disableAncillaryFetch,
  });
  const { reviews: patientReviews, loading: patientReviewsLoading } =
    usePatientReviews({
      treatmentId,
      treatmentSlug: localizedTreatment.slug,
      enabled: !disableAncillaryFetch,
    });
  const { stories: patientStories, loading: patientStoriesLoading } =
    usePatientStories({
      treatmentId,
      treatmentSlug: localizedTreatment.slug,
      enabled: !disableAncillaryFetch,
    });

  const formatCurrency = (value: number, currency?: string | null) => {
    try {
      return new Intl.NumberFormat(numberLocale, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `$${new Intl.NumberFormat(numberLocale).format(value)}`;
    }
  };

  const formatDayCount = (value: number) => {
    const formattedValue = numberFormatter.format(value);

    return isArabicLocale
      ? `${formattedValue} يوم`
      : `${formattedValue} day${value === 1 ? "" : "s"}`;
  };

  const formatPercentage = (value: number) =>
    `${numberFormatter.format(value)}%`;

  const primaryProcedure = selectPrimaryProcedure(
    localizedTreatment.procedures,
  );
  const fallbackDuration =
    typeof primaryProcedure?.duration === "string"
      ? primaryProcedure.duration.trim()
      : "";
  const fallbackRecovery =
    typeof primaryProcedure?.recovery === "string"
      ? primaryProcedure.recovery.trim()
      : "";
  const fallbackSuccess =
    typeof primaryProcedure?.successRate === "string"
      ? primaryProcedure.successRate.trim()
      : "";
  const quickFacts = {
    durationLabel: localizedTreatment.durationDays
      ? formatDayCount(localizedTreatment.durationDays)
      : localizeOptionalDigits(fallbackDuration, locale) || undefined,
    recoveryLabel: localizedTreatment.recoveryTimeDays
      ? formatDayCount(localizedTreatment.recoveryTimeDays)
      : localizeOptionalDigits(fallbackRecovery, locale) || undefined,
    priceValue:
      localizedTreatment.basePrice ?? primaryProcedure?.egyptPrice ?? undefined,
    currency: localizedTreatment.currency ?? "USD",
    successRateLabel:
      localizedTreatment.successRate !== undefined &&
      localizedTreatment.successRate !== null
        ? formatPercentage(localizedTreatment.successRate)
        : localizeOptionalDigits(fallbackSuccess, locale) || undefined,
  };

  const hasQuickFacts = Boolean(
    quickFacts.durationLabel ||
      quickFacts.recoveryLabel ||
      (typeof quickFacts.priceValue === "number" &&
        !Number.isNaN(quickFacts.priceValue)) ||
      quickFacts.successRateLabel ||
      localizedTreatment.downloadUrl,
  );

  const clearFilters = () => {
    setSearch("");
    setProcedureId("");
  };

  const handleTreatmentChange = (value: string) => {
    if (value === ALL_OPTION_VALUE) {
      router.push(treatmentsHref);
      return;
    }

    if (!value || value === localizedTreatment.slug) {
      return;
    }

    router.push(localizePublicPathname(`/treatments/${value}`, locale));
  };

  const hasActiveFilters = Boolean(search) || Boolean(procedureId);

  return (
    <div className="bg-background">
      <section className="border-b border-border/50 bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-6">
            <Button asChild variant="ghost" className="px-0 text-primary">
              <Link href={treatmentsHref}>
                {isArabicLocale ? (
                  <ArrowRight className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                )}
                {block.labels.backLink}
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div className="space-y-5">
                {block.eyebrow ? (
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    {block.eyebrow}
                  </p>
                ) : null}
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                    {getLocalizedText(localizedTreatment.name, locale)}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                    {localizeOptionalDigits(
                      localizedTreatment.summary ||
                        localizedTreatment.description ||
                        block.labels.fallbackDescription,
                      locale,
                    )}
                  </p>
                </div>

                {block.trustStatement ? (
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                        {localizeOptionalDigits(block.trustStatement, locale)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl text-foreground">
                    {block.sectionTitles.quickFacts}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickFacts.durationLabel ? (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {block.quickFactLabels.duration}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quickFacts.durationLabel}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {quickFacts.recoveryLabel ? (
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {block.quickFactLabels.recovery}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quickFacts.recoveryLabel}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {typeof quickFacts.priceValue === "number" ? (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {block.quickFactLabels.estimatedCost}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(
                            quickFacts.priceValue,
                            quickFacts.currency,
                          )}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {quickFacts.successRateLabel ? (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {block.quickFactLabels.successRate}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quickFacts.successRateLabel}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {localizedTreatment.downloadUrl ? (
                    <div className="flex items-center gap-3">
                      <FileDown className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {block.quickFactLabels.treatmentPdf}
                        </p>
                        <a
                          href={localizedTreatment.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          {block.quickFactLabels.downloadOverview}
                        </a>
                      </div>
                    </div>
                  ) : null}
                  {!hasQuickFacts ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="font-medium text-foreground">
                        {block.quickFactLabels.personalizedConsultation}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {
                          block.quickFactLabels
                            .personalizedConsultationDescription
                        }
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {localizedTreatment.heroImageUrl || localizedTreatment.cardImageUrl ? (
        <section className="bg-background py-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/60">
              <div className="relative aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/6]">
                <Image
                  src={
                    localizedTreatment.heroImageUrl ||
                    localizedTreatment.cardImageUrl ||
                    "/hero-medical-facility.webp"
                  }
                  alt={localizedTreatment.name}
                  fill
                  className="object-cover"
                  loading={resolveHeroImageLoading()}
                  sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold text-foreground">
                  {block.sectionTitles.overview}
                </h2>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  {block.sectionDescriptions.overview}
                </p>
              </div>
              <p className="text-base leading-8 text-muted-foreground sm:text-lg">
                {localizeOptionalDigits(
                  localizedTreatment.overview ||
                    localizedTreatment.description ||
                    block.labels.fallbackOverview,
                  locale,
                )}
              </p>
            </div>

            <Card className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">
                  {block.sectionTitles.idealCandidates}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {localizedTreatment.idealCandidates.length > 0 ? (
                  <ul className="space-y-3">
                    {localizedTreatment.idealCandidates.map((candidate) => (
                      <li key={candidate} className="flex items-start gap-3">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm leading-6 text-muted-foreground">
                          {getLocalizedText(candidate, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {block.labels.candidateSuitability}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-muted/10 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm uppercase tracking-[0.18em]">
                  {block.eyebrow || localizedTreatment.name}
                </span>
              </div>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                {block.sectionTitles.procedures}
              </h2>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {block.sectionDescriptions.procedures}
              </p>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {block.filterLabels.search}
                </p>
                <Input
                  placeholder={block.searchPlaceholder}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {block.filterLabels.treatment}
                  </p>
                  <FilterComboBox
                    value={localizedTreatment.slug || ALL_OPTION_VALUE}
                    options={treatmentComboOptions}
                    placeholder={block.filterPlaceholders.treatment}
                    searchPlaceholder={block.filterSearchPlaceholders.treatment}
                    emptyLabel={block.filterEmptyCopy.treatment}
                    popoverWidth="trigger"
                    onChange={handleTreatmentChange}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {block.filterLabels.procedure}
                  </p>
                  <FilterComboBox
                    value={procedureId || ALL_OPTION_VALUE}
                    options={procedureOptions}
                    placeholder={block.filterPlaceholders.procedure}
                    searchPlaceholder={block.filterSearchPlaceholders.procedure}
                    emptyLabel={block.filterEmptyCopy.procedure}
                    popoverWidth="trigger"
                    onChange={(value) =>
                      setProcedureId(value === ALL_OPTION_VALUE ? "" : value)
                    }
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <Button
                    variant="outline"
                    className="h-12 w-full"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    {block.clearButtonLabel}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {block.states.resultsIntro}
              </p>
              <Badge variant="outline" className="w-fit">
                {numberFormatter.format(procedureDirectoryState.filtered)} /{" "}
                {numberFormatter.format(procedureDirectoryState.total)}{" "}
                {block.states.resultsCountLabel}
              </Badge>
            </div>

            {procedureDirectoryState.filtered === 0 ? (
              <div className="rounded-[2rem] border border-border/60 bg-background p-10 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {block.states.emptyHeading}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {block.states.emptyDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {procedureDirectoryState.procedures.map((procedure) => (
                  <TreatmentProcedureCard
                    key={procedure.id}
                    procedure={procedure}
                    block={block}
                    locale={locale}
                    slug={slug}
                    currency={localizedTreatment.currency}
                    numberLocale={numberLocale}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold text-foreground">
                {block.sectionTitles.specialists}
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {block.sectionDescriptions.specialists}
              </p>
            </div>

            {doctorsLoading ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div
                className={cn(
                  "grid gap-8",
                  doctors.length > 1 && "xl:grid-cols-2",
                )}
              >
                {doctors.map((doctor, index) => (
                  <DoctorShowcaseCard
                    key={doctor.id}
                    doctor={{
                      ...doctor,
                      bio: truncateText(doctor.bio, 180) ?? undefined,
                    }}
                    locale={locale}
                    index={index}
                    companyName={companyName}
                    className={
                      doctors.length === 1
                        ? "mx-auto w-full max-w-4xl"
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-muted/20 p-10 text-center text-muted-foreground">
                {block.labels.noSpecialists}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            {patientReviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientReviews.length > 0 ? (
              <DoctorReviews
                reviews={patientReviews.map((review) => ({
                  ...review,
                  patient_country:
                    review.patient_country ?? block.labels.internationalLabel,
                  procedure_name: review.procedure_name ?? undefined,
                  recovery_time: review.recovery_time ?? "",
                  is_verified: true,
                }))}
                locale={locale}
              />
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-muted/20 p-10 text-center">
                <h2 className="text-2xl font-semibold text-foreground">
                  {block.sectionTitles.patientReviews}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {block.labels.patientReviewsEmpty}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-muted/10 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold text-foreground">
                {block.sectionTitles.patientStories}
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {block.sectionDescriptions.patientStories}
              </p>
            </div>

            {patientStoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientStories.length > 0 ? (
              <div className="grid gap-8 lg:grid-cols-2">
                {patientStories.map((story) => (
                  <Card
                    key={story.id}
                    className="border-border/60 bg-card/90 shadow-sm"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="w-fit">
                          {story.locale?.toUpperCase() ?? "EN"}
                        </Badge>
                        {story.featured ? (
                          <Badge variant="outline">
                            {block.labels.featuredSuccess}
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="text-2xl text-foreground">
                        {getLocalizedText(story.headline, locale)}
                      </CardTitle>
                      {story.excerpt ? (
                        <p className="text-sm leading-7 text-muted-foreground">
                          {localizeOptionalDigits(story.excerpt, locale)}
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="line-clamp-6 text-sm leading-7 text-muted-foreground">
                        {localizeOptionalDigits(
                          story.body_markdown.replace(/[#*_`>/]/g, ""),
                          locale,
                        )}
                      </p>
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(story.created_at).toLocaleDateString(
                            isArabicLocale ? "ar-EG" : "en-US",
                          )}
                        </span>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={consultationHref}>
                            {block.labels.requestConsultation}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-background p-10 text-center text-muted-foreground">
                {block.labels.noPatientStories}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
