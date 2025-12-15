"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import {
  buildProcedureMap,
  formatFacilityLocation,
  getProceduresForProvider,
  pickFacilityImage,
  type ProcedureOption,
} from "@/lib/medical-facilities";
import { Building2, Loader2, MapPin, Star } from "lucide-react";

type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];

type ApiResponse = {
  providers: ServiceProviderRow[];
  filters: {
    countries: string[];
    cities: string[];
    procedures: ProcedureOption[];
  };
};

type Filters = {
  search: string;
  country: string;
  city: string;
  specialty: string;
  procedureId: string;
};

const fetchFacilities = async (filters: Filters): Promise<ApiResponse> => {
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
    | { data?: ApiResponse }
    | ApiResponse;

  if ("data" in payload && payload.data) {
    return payload.data;
  }

  return payload as ApiResponse;
};

export default function MedicalFacilitiesPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [procedureId, setProcedureId] = useState("");

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      "medical-facilities",
      { search, country, city, specialty, procedureId },
    ],
    queryFn: () =>
      fetchFacilities({ search, country, city, specialty, procedureId }),
  });

  const specialtyOptions = useMemo(() => {
    if (!data?.providers) return [];
    const set = new Set<string>();
    data.providers.forEach((provider) => {
      (provider.specialties ?? []).forEach((spec) => {
        if (spec) set.add(spec);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data?.providers]);

  const proceduresMap = useMemo(() => {
    return buildProcedureMap(data?.filters?.procedures ?? []);
  }, [data?.filters?.procedures]);

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setCity("");
    setSpecialty("");
    setProcedureId("");
  };

  const providers = data?.providers ?? [];
  const countryOptions = data?.filters?.countries ?? [];
  const cityOptions = data?.filters?.cities ?? [];
  const procedureOptions = data?.filters?.procedures ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-card py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    Premium Network
                  </p>
                  <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    Medical Facilities
                  </h1>
                  <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                    Browse partner hospitals and clinics, filter by country,
                    city, specialty, or procedure, and connect with the right
                    care team for your treatment journey.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Trusted providers
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      Curated &amp; vetted by Care N Tour
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <Input
                placeholder="Search by facility, city, or treatment..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Select
                  value={country || "all"}
                  onValueChange={(value) =>
                    setCountry(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={city || "all"}
                  onValueChange={(value) =>
                    setCity(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {cityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={specialty || "all"}
                  onValueChange={(value) =>
                    setSpecialty(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All specialties</SelectItem>
                    {specialtyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={procedureId || "all"}
                  onValueChange={(value) =>
                    setProcedureId(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All procedures" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All procedures</SelectItem>
                    {procedureOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                        {option.treatmentName
                          ? ` • ${option.treatmentName}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="w-full lg:h-full"
                  onClick={clearFilters}
                  disabled={
                    !search && !country && !city && !specialty && !procedureId
                  }
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {isError ? (
              <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-destructive">
                Unable to load medical facilities right now. Please try again
                later.
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Card
                    key={idx}
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
            ) : null}

            {!isLoading && providers.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-10 text-center">
                <p className="text-lg font-semibold text-foreground">
                  No medical facilities found
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust your filters to see more options.
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
                        aria-label={`View ${provider.name} profile`}
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={image}
                            alt={provider.name}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                          />
                          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-background/90"
                            >
                              {provider.facility_type.replace("_", " ")}
                            </Badge>
                            {location ? (
                              <Badge
                                variant="outline"
                                className="bg-background/80"
                              >
                                <MapPin className="mr-1 h-3 w-3" />
                                {location}
                              </Badge>
                            ) : null}
                          </div>
                          {typeof provider.rating === "number" ? (
                            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold text-foreground shadow-sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {provider.rating.toFixed(1)}
                            </div>
                          ) : null}
                        </div>

                        <CardHeader className="space-y-2">
                          <CardTitle className="text-xl">
                            {provider.name}
                          </CardTitle>
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
                                Specialties
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {provider.specialties
                                  .slice(0, 6)
                                  .map((specialty) => (
                                    <Badge key={specialty} variant="outline">
                                      {specialty}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ) : null}

                          {procedures.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">
                                Procedures
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

                          {provider.facilities &&
                          provider.facilities.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">
                                Facilities provided
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

                          {provider.amenities &&
                          provider.amenities.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">
                                Amenities
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
                            ? `${provider.review_count} reviews`
                            : "Partner facility"}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline">
                            <Link href="/contact">Contact</Link>
                          </Button>
                          <Button asChild>
                            <Link href="/start-journey">
                              Start your journey
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
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating results...
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
