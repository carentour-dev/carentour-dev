"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Star } from "lucide-react";
import type { BlockInstance } from "@/lib/cms/blocks";
import {
  buildMedicalFacilitiesDirectoryState,
  buildProcedureMap,
  formatFacilityLocation,
  getProceduresForProvider,
  pickFacilityImage,
  type MedicalFacilitiesDirectoryResponse,
  type ProcedureOption,
} from "@/lib/medical-facilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FilterComboBox,
  type FilterComboBoxOption,
} from "@/components/ui/filter-combobox";
import { Input } from "@/components/ui/input";

type Filters = {
  search: string;
  country: string;
  city: string;
  specialty: string;
  procedureId: string;
};

type Props = {
  block: BlockInstance<"medicalFacilitiesDirectory">;
  initialData: MedicalFacilitiesDirectoryResponse;
  disableLiveFetch?: boolean;
};

const ALL_OPTION_VALUE = "__all__";

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

const fetchFacilities = async (filters: Filters) => {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.country) params.set("country", filters.country);
  if (filters.city) params.set("city", filters.city);
  if (filters.specialty) params.set("specialty", filters.specialty);
  if (filters.procedureId) params.set("procedureId", filters.procedureId);

  const qs = params.toString();
  const response = await fetch(`/api/medical-facilities${qs ? `?${qs}` : ""}`);

  if (!response.ok) {
    throw new Error("Failed to load medical facilities");
  }

  const payload = (await response.json()) as
    | { data?: MedicalFacilitiesDirectoryResponse }
    | MedicalFacilitiesDirectoryResponse;

  if ("data" in payload && payload.data) {
    return payload.data;
  }

  return payload as MedicalFacilitiesDirectoryResponse;
};

export function MedicalFacilitiesDirectoryClient({
  block,
  initialData,
  disableLiveFetch = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [selectedProcedureOption, setSelectedProcedureOption] =
    useState<ProcedureOption | null>(null);
  const deferredSearch = useDeferredValue(search);

  const localData = useMemo(
    () =>
      buildMedicalFacilitiesDirectoryState({
        providers: initialData.providers,
        procedures: initialData.filters.procedures,
        filters: {
          search: deferredSearch,
          country,
          city,
          specialty,
          procedureId,
        },
      }),
    [
      city,
      country,
      deferredSearch,
      initialData.filters.procedures,
      initialData.providers,
      procedureId,
      specialty,
    ],
  );

  const query = useQuery({
    queryKey: [
      "medical-facilities",
      { search: deferredSearch, country, city, specialty, procedureId },
    ],
    queryFn: () =>
      fetchFacilities({
        search: deferredSearch,
        country,
        city,
        specialty,
        procedureId,
      }),
    enabled: !disableLiveFetch,
    initialData: disableLiveFetch ? undefined : initialData,
  });

  const data = disableLiveFetch ? localData : (query.data ?? initialData);
  const isLoading = disableLiveFetch
    ? false
    : query.isLoading && query.data == null;
  const isFetching = disableLiveFetch ? false : query.isFetching;
  const isError = disableLiveFetch ? false : query.isError;

  const specialtyOptions = useMemo(
    () => data?.filters?.specialties ?? [],
    [data?.filters?.specialties],
  );

  const proceduresMap = useMemo(
    () => buildProcedureMap(data?.filters?.procedures ?? []),
    [data?.filters?.procedures],
  );

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setCity("");
    setSpecialty("");
    setProcedureId("");
    setSelectedProcedureOption(null);
  };

  const providers = data?.providers ?? [];
  const countryOptions = useMemo(
    () => data?.filters?.countries ?? [],
    [data?.filters?.countries],
  );
  const cityOptions = useMemo(
    () => data?.filters?.cities ?? [],
    [data?.filters?.cities],
  );
  const procedureOptions = useMemo(
    () => data?.filters?.procedures ?? [],
    [data?.filters?.procedures],
  );
  const countryComboOptions = useMemo(
    () =>
      buildFilterOptions(
        countryOptions,
        block.filterPlaceholders.country,
        country,
      ),
    [block.filterPlaceholders.country, country, countryOptions],
  );
  const cityComboOptions = useMemo(
    () => buildFilterOptions(cityOptions, block.filterPlaceholders.city, city),
    [block.filterPlaceholders.city, city, cityOptions],
  );
  const specialtyComboOptions = useMemo(
    () =>
      buildFilterOptions(
        specialtyOptions,
        block.filterPlaceholders.specialty,
        specialty,
      ),
    [block.filterPlaceholders.specialty, specialty, specialtyOptions],
  );
  const procedureComboOptions = useMemo(() => {
    const options = new Map<string, FilterComboBoxOption>();

    options.set(ALL_OPTION_VALUE, {
      value: ALL_OPTION_VALUE,
      label: block.filterPlaceholders.procedure,
      searchTerms: [block.filterPlaceholders.procedure],
    });

    procedureOptions.forEach((option) => {
      options.set(option.id, {
        value: option.id,
        label: option.name,
        description: option.treatmentName ?? undefined,
        searchTerms: [option.name, option.treatmentName ?? ""],
      });
    });

    if (selectedProcedureOption && !options.has(selectedProcedureOption.id)) {
      options.set(selectedProcedureOption.id, {
        value: selectedProcedureOption.id,
        label: selectedProcedureOption.name,
        description: selectedProcedureOption.treatmentName ?? undefined,
        searchTerms: [
          selectedProcedureOption.name,
          selectedProcedureOption.treatmentName ?? "",
        ],
      });
    }

    const allOption = options.get(ALL_OPTION_VALUE)!;
    options.delete(ALL_OPTION_VALUE);

    return [
      allOption,
      ...Array.from(options.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [
    block.filterPlaceholders.procedure,
    procedureOptions,
    selectedProcedureOption,
  ]);

  useEffect(() => {
    if (!procedureId) {
      setSelectedProcedureOption(null);
      return;
    }

    const matchedProcedure = procedureOptions.find(
      (option) => option.id === procedureId,
    );

    if (matchedProcedure) {
      setSelectedProcedureOption(matchedProcedure);
    }
  }, [procedureId, procedureOptions]);

  const handleCountryChange = (value: string) => {
    setCountry(value === ALL_OPTION_VALUE ? "" : value);
    setCity("");
  };

  const handleCityChange = (value: string) => {
    setCity(value === ALL_OPTION_VALUE ? "" : value);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value === ALL_OPTION_VALUE ? "" : value);
    setProcedureId("");
    setSelectedProcedureOption(null);
  };

  const handleProcedureChange = (value: string) => {
    if (value === ALL_OPTION_VALUE) {
      setProcedureId("");
      setSelectedProcedureOption(null);
      return;
    }

    setProcedureId(value);

    const matchedProcedure = procedureOptions.find(
      (option) => option.id === value,
    );

    if (matchedProcedure) {
      setSelectedProcedureOption(matchedProcedure);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(country) ||
    Boolean(city) ||
    Boolean(specialty) ||
    Boolean(procedureId);

  return (
    <div className="space-y-10">
      {(block.eyebrow || block.heading || block.description) && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {block.eyebrow ? (
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            {block.heading ? (
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {block.heading}
              </h2>
            ) : null}
            {block.description ? (
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                {block.description}
              </p>
            ) : null}
          </div>

          <div className="max-w-md rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {block.trustCallout.eyebrow}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {block.trustCallout.title}
                </p>
                {block.trustCallout.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {block.trustCallout.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.country}
            </p>
            <FilterComboBox
              value={country || ALL_OPTION_VALUE}
              options={countryComboOptions}
              placeholder={block.filterPlaceholders.country}
              searchPlaceholder={block.filterSearchPlaceholders.country}
              emptyLabel={block.filterEmptyCopy.country}
              popoverWidth="trigger"
              onChange={handleCountryChange}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.city}
            </p>
            <FilterComboBox
              value={city || ALL_OPTION_VALUE}
              options={cityComboOptions}
              placeholder={block.filterPlaceholders.city}
              searchPlaceholder={block.filterSearchPlaceholders.city}
              emptyLabel={block.filterEmptyCopy.city}
              popoverWidth="trigger"
              onChange={handleCityChange}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.specialty}
            </p>
            <FilterComboBox
              value={specialty || ALL_OPTION_VALUE}
              options={specialtyComboOptions}
              placeholder={block.filterPlaceholders.specialty}
              searchPlaceholder={block.filterSearchPlaceholders.specialty}
              emptyLabel={block.filterEmptyCopy.specialty}
              popoverWidth="adaptive"
              onChange={handleSpecialtyChange}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {block.filterLabels.procedure}
            </p>
            <FilterComboBox
              value={procedureId || ALL_OPTION_VALUE}
              options={procedureComboOptions}
              placeholder={block.filterPlaceholders.procedure}
              searchPlaceholder={block.filterSearchPlaceholders.procedure}
              emptyLabel={block.filterEmptyCopy.procedure}
              popoverWidth="wide"
              onChange={handleProcedureChange}
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

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {block.states.resultsIntro}
          </p>
          {!isLoading && !isError ? (
            <Badge variant="outline" className="w-fit">
              {providers.length} {block.states.resultsCountLabel}
            </Badge>
          ) : null}
        </div>

        {isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-destructive">
            <p className="font-semibold">{block.states.errorTitle}</p>
            <p className="mt-1 text-sm">{block.states.errorDescription}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {block.states.loading}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden border-border/60 bg-muted/30"
                >
                  <div className="aspect-video animate-pulse bg-muted" />
                  <CardHeader>
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {!isLoading && providers.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-10 text-center">
            <p className="text-lg font-semibold text-foreground">
              {block.states.emptyHeading}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {block.states.emptyDescription}
            </p>
          </div>
        ) : null}

        {!isLoading && providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {providers.map((provider) => {
              const location = formatFacilityLocation(provider);
              const image = pickFacilityImage(provider);
              const procedures = getProceduresForProvider(
                provider,
                proceduresMap,
              );

              return (
                <Card
                  key={provider.id}
                  className="overflow-hidden border-border/60 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={`/medical-facilities/${provider.slug}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`${block.cardLabels.viewProfile}: ${provider.name}`}
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={image}
                        alt={provider.name}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-background/90">
                          {provider.facility_type.replace("_", " ")}
                        </Badge>
                        {location ? (
                          <Badge variant="outline" className="bg-background/80">
                            <MapPin className="mr-1 h-3 w-3" />
                            {location}
                          </Badge>
                        ) : null}
                        {provider.is_partner === false ? null : (
                          <Badge variant="outline" className="bg-background/80">
                            <Building2 className="mr-1 h-3 w-3" />
                            {block.cardLabels.partnerBadge}
                          </Badge>
                        )}
                      </div>
                      {typeof provider.rating === "number" ? (
                        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold text-foreground shadow-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {provider.rating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>

                    <CardHeader className="space-y-2">
                      <CardTitle className="text-xl">{provider.name}</CardTitle>
                      {(provider.overview || provider.description) && (
                        <p className="text-sm text-muted-foreground">
                          {provider.overview ?? provider.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4 pb-0">
                      {provider.specialties &&
                      provider.specialties.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {block.cardLabels.specialties}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {provider.specialties.slice(0, 6).map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {procedures.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {block.cardLabels.procedures}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {procedures.slice(0, 6).map((procedure) => (
                              <Badge key={procedure.id} variant="secondary">
                                {procedure.name}
                                {procedure.treatmentName
                                  ? ` • ${procedure.treatmentName}`
                                  : ""}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {provider.facilities && provider.facilities.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {block.cardLabels.facilities}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {provider.facilities.slice(0, 6).map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {provider.amenities && provider.amenities.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {block.cardLabels.amenities}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {provider.amenities.slice(0, 6).map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Link>

                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="text-sm text-muted-foreground">
                      {provider.review_count
                        ? `${provider.review_count} ${block.cardLabels.reviewsSuffix}`
                        : block.cardLabels.fallbackMeta}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href="/contact">{block.cardLabels.contact}</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/start-journey">
                          {block.cardLabels.primaryCta}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        {isFetching && !isLoading ? (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {block.states.updating}
          </div>
        ) : null}
      </div>
    </div>
  );
}
