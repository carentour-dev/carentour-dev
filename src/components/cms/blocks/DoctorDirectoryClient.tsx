"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Loader2, Search, Star } from "lucide-react";
import { useDoctors } from "@/hooks/useDoctors";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import {
  buildDoctorDirectoryState,
  getDoctorInitials,
  normalizeDoctorForClient,
  pickDoctorImage,
  type DoctorDirectoryResponse,
} from "@/lib/doctors";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FilterComboBox,
  type FilterComboBoxOption,
} from "@/components/ui/filter-combobox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  block: BlockInstance<"doctorDirectory">;
  initialData: DoctorDirectoryResponse;
  disableLiveFetch?: boolean;
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
  options: string[],
  allLabel: string,
  selectedValue: string,
): FilterComboBoxOption[] => {
  const values = new Set(options);

  if (selectedValue) {
    values.add(selectedValue);
  }

  return [
    { value: ALL_OPTION_VALUE, label: allLabel, searchTerms: [allLabel] },
    ...Array.from(values)
      .sort((a, b) => a.localeCompare(b))
      .map((option) => ({
        value: option,
        label: option,
      })),
  ];
};

export function DoctorDirectoryClient({
  block,
  initialData,
  disableLiveFetch = false,
}: Props) {
  const locale = useLocale() as PublicLocale;
  const companyName = getLocalizedCompanyName(locale);
  const numberLocale = getPublicNumberLocale(locale);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
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
  const deferredSearch = useDeferredValue(search);
  const {
    doctors: liveDoctors,
    loading,
    isFetching,
    error,
  } = useDoctors(undefined, {
    enabled: !disableLiveFetch,
    initialData: initialData.doctors.map(normalizeDoctorForClient),
    locale,
  });

  const sourceDoctors = disableLiveFetch ? initialData.doctors : liveDoctors;
  const directoryState = useMemo(
    () =>
      buildDoctorDirectoryState({
        doctors: sourceDoctors,
        filters: {
          search: deferredSearch,
          specialty,
          language,
        },
      }),
    [deferredSearch, language, sourceDoctors, specialty],
  );

  const specialtyOptions = useMemo(
    () =>
      buildFilterOptions(
        directoryState.filters.specialties,
        block.filterPlaceholders.specialty,
        specialty,
      ),
    [
      block.filterPlaceholders.specialty,
      directoryState.filters.specialties,
      specialty,
    ],
  );
  const languageOptions = useMemo(
    () =>
      buildFilterOptions(
        directoryState.filters.languages,
        block.filterPlaceholders.language,
        language,
      ),
    [
      block.filterPlaceholders.language,
      directoryState.filters.languages,
      language,
    ],
  );

  const doctors = directoryState.doctors;
  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(specialty) || Boolean(language);

  const clearFilters = () => {
    setSearch("");
    setSpecialty("");
    setLanguage("");
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value === ALL_OPTION_VALUE ? "" : value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value === ALL_OPTION_VALUE ? "" : value);
  };

  return (
    <div className="space-y-10">
      {(block.eyebrow || block.heading || block.description) && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)] xl:items-start">
          <div className="space-y-4">
            {block.eyebrow ? (
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            {block.heading ? (
              <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {block.heading}
              </h2>
            ) : null}
            {block.description ? (
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {block.description}
              </p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {block.trustCallout.eyebrow}
            </p>
            <p className="mt-3 text-xl font-semibold leading-tight text-foreground">
              {block.trustCallout.title}
            </p>
            {block.trustCallout.description ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {block.trustCallout.description}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-[32px] border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_160px]">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.search}
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={block.searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.specialty}
            </p>
            <FilterComboBox
              value={specialty || ALL_OPTION_VALUE}
              options={specialtyOptions}
              placeholder={block.filterPlaceholders.specialty}
              searchPlaceholder={block.filterSearchPlaceholders.specialty}
              emptyLabel={block.filterEmptyCopy.specialty}
              popoverWidth="adaptive"
              onChange={handleSpecialtyChange}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.language}
            </p>
            <FilterComboBox
              value={language || ALL_OPTION_VALUE}
              options={languageOptions}
              placeholder={block.filterPlaceholders.language}
              searchPlaceholder={block.filterSearchPlaceholders.language}
              emptyLabel={block.filterEmptyCopy.language}
              popoverWidth="adaptive"
              onChange={handleLanguageChange}
            />
          </div>

          <div className="flex flex-col justify-end">
            <Button
              variant="outline"
              className="h-10 w-full"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              {block.clearButtonLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {block.states.resultsIntro}
          </p>
          {!loading && !error ? (
            <Badge variant="outline" className="w-fit">
              {integerFormatter.format(doctors.length)}{" "}
              {block.states.resultsCountLabel}
            </Badge>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-destructive">
            <p className="font-semibold">{block.states.errorTitle}</p>
            <p className="mt-1 text-sm">{block.states.errorDescription}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {block.states.loading}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] border border-border/60 bg-muted/20"
                >
                  <div className="grid md:grid-cols-[180px_1fr]">
                    <div className="min-h-[240px] animate-pulse bg-muted" />
                    <div className="space-y-4 p-6">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 animate-pulse rounded bg-muted" />
                        <div className="h-16 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && doctors.length === 0 ? (
          <div className="rounded-[28px] border border-border/60 bg-muted/30 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-foreground">
              {block.states.emptyHeading}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {block.states.emptyDescription}
            </p>
          </div>
        ) : null}

        {!loading && doctors.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {doctors.map((doctor) => {
              const image = pickDoctorImage(doctor);
              const trimmedBio = truncateText(doctor.bio, 180);
              const hasFeaturedBadge = (doctor.patient_rating ?? 0) >= 4.8;

              return (
                <article
                  key={doctor.id}
                  className="group overflow-hidden rounded-[30px] border border-border/60 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid md:grid-cols-[190px_1fr]">
                    <div className="relative min-h-[250px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
                      {image ? (
                        <Image
                          src={image}
                          alt={doctor.name}
                          fill
                          sizes="(min-width: 1280px) 190px, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {hasFeaturedBadge ? (
                          <Badge className="border-0 bg-background/90 text-foreground">
                            {block.cardLabels.featuredBadge}
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
                        <p className="text-xs uppercase tracking-[0.18em] text-white/70">
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
                              {ratingFormatter.format(
                                doctor.patient_rating,
                              )}{" "}
                              {block.cardLabels.ratingLabel}
                            </Badge>
                          ) : null}
                          {(doctor.total_reviews ?? 0) > 0 ? (
                            <Badge variant="outline">
                              {integerFormatter.format(doctor.total_reviews)}{" "}
                              {block.cardLabels.reviewsSuffix}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {companyName}
                        </p>
                      </div>

                      {trimmedBio ? (
                        <p className="mt-5 text-sm leading-6 text-muted-foreground">
                          {trimmedBio}
                        </p>
                      ) : null}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        <div className="min-w-0 rounded-2xl bg-muted/45 p-4">
                          <p className="text-[11px] uppercase leading-snug tracking-[0.14em] text-muted-foreground [overflow-wrap:anywhere]">
                            {block.cardLabels.experience}
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {integerFormatter.format(doctor.experience_years)}{" "}
                            {block.cardLabels.experienceSuffix}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-muted/45 p-4">
                          <p className="text-[11px] uppercase leading-snug tracking-[0.14em] text-muted-foreground [overflow-wrap:anywhere]">
                            {block.cardLabels.procedures}
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {integerFormatter.format(
                              doctor.successful_procedures ?? 0,
                            )}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-muted/45 p-4">
                          <p className="text-[11px] uppercase leading-snug tracking-[0.14em] text-muted-foreground [overflow-wrap:anywhere]">
                            {block.cardLabels.publications}
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {integerFormatter.format(
                              doctor.research_publications ?? 0,
                            )}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-muted/45 p-4">
                          <p className="text-[11px] uppercase leading-snug tracking-[0.14em] text-muted-foreground [overflow-wrap:anywhere]">
                            {block.cardLabels.languages}
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {integerFormatter.format(
                              (doctor.languages ?? []).length,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {block.cardLabels.education}
                          </p>
                          <p className="text-sm leading-6 text-foreground">
                            {doctor.education}
                          </p>
                        </div>

                        {(doctor.languages ?? []).length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {block.cardLabels.languages}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(doctor.languages ?? [])
                                .slice(0, 6)
                                .map((entry) => (
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
                            href={localizePublicPathname(
                              `/doctors/${doctor.id}`,
                              locale,
                            )}
                          >
                            {block.cardLabels.viewProfile}
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="sm:flex-1">
                          <Link
                            href={`${localizePublicPathnameWithFallback("/start-journey", locale)}?doctor=${doctor.id}`}
                          >
                            {block.cardLabels.primaryCta}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {isFetching && !loading ? (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {block.states.updating}
          </div>
        ) : null}
      </div>
    </div>
  );
}
