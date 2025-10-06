"use client";

import { useMemo, useCallback } from "react";
import type { ComponentType, MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Eye, Smile, Scissors, Stethoscope, Activity } from "lucide-react";
import { useTreatments } from "@/hooks/useTreatments";
import { normalizeTreatment, getPrimaryProcedure } from "@/lib/treatments";

type TreatmentPresentation = {
  image: string;
  Icon: ComponentType<{ className?: string }>;
};

type FeaturedTreatmentCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceLabel: string;
  durationLabel: string;
  image: string;
  Icon: ComponentType<{ className?: string }>;
  isFeatured: boolean;
};

const DEFAULT_PRESENTATION: TreatmentPresentation = {
  image: "/hero-medical-facility.webp",
  Icon: Stethoscope,
};

const TREATMENT_PRESENTATION: Record<string, TreatmentPresentation> = {
  "cardiac-surgery": { image: "/surgery-suite.webp", Icon: Heart },
  cardiology: { image: "/surgery-suite.webp", Icon: Heart },
  "advanced-cardiac-bypass": { image: "/surgery-suite.webp", Icon: Heart },
  "tavr-program": { image: "/surgery-suite.webp", Icon: Heart },
  "eye-surgery": { image: "/consultation.webp", Icon: Eye },
  ophthalmology: { image: "/consultation.webp", Icon: Eye },
  "retinal-repair-macular-care": { image: "/consultation.webp", Icon: Eye },
  "laser-vision-elite": { image: "/consultation.webp", Icon: Eye },
  "dental-care": { image: "/surgery-suite.webp", Icon: Smile },
  dentistry: { image: "/surgery-suite.webp", Icon: Smile },
  "signature-smile-makeover": { image: "/surgery-suite.webp", Icon: Smile },
  "cosmetic-surgery": { image: "/consultation.webp", Icon: Scissors },
  cosmetic: { image: "/consultation.webp", Icon: Scissors },
  "orthopedic-surgery": { image: "/surgery-suite.webp", Icon: Activity },
  orthopedic: { image: "/surgery-suite.webp", Icon: Activity },
};

const formatCurrency = (value: number, currency?: string | null) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `$${value.toLocaleString()}`;
  }
};

const getPresentation = (slug?: string | null, category?: string | null): TreatmentPresentation => {
  const slugKey = slug?.toLowerCase();
  if (slugKey && TREATMENT_PRESENTATION[slugKey]) {
    return TREATMENT_PRESENTATION[slugKey];
  }

  const categoryKey = category?.toLowerCase();
  if (categoryKey && TREATMENT_PRESENTATION[categoryKey]) {
    return TREATMENT_PRESENTATION[categoryKey];
  }

  return DEFAULT_PRESENTATION;
};

const FeaturedTreatments = () => {
  const router = useRouter();
  const { treatments, loading, error } = useTreatments();

  const featuredTreatments = useMemo<FeaturedTreatmentCard[]>(() => {
    if (treatments.length === 0) {
      return [];
    }

    const normalized = treatments
      .map((treatment) => normalizeTreatment(treatment))
      .filter((treatment) => treatment.is_active !== false && treatment.is_featured === true);

    const prepared = normalized.reduce<
      (FeaturedTreatmentCard & { priceValue: number | null })[]
    >((acc, treatment) => {
      if (!treatment.slug) {
        return acc;
      }

      const presentation = getPresentation(treatment.slug, treatment.category);
      const primaryProcedure = getPrimaryProcedure(treatment.procedures);

      const basePriceCandidate =
        typeof treatment.base_price === "number"
          ? treatment.base_price
          : primaryProcedure?.egyptPrice ?? null;

      const stay =
        typeof treatment.duration_days === "number" && Number.isFinite(treatment.duration_days)
          ? `${treatment.duration_days} day${treatment.duration_days === 1 ? "" : "s"}`
          : null;

      const recovery =
        typeof treatment.recovery_time_days === "number" && Number.isFinite(treatment.recovery_time_days)
          ? `${treatment.recovery_time_days} day${treatment.recovery_time_days === 1 ? "" : "s"} recovery`
          : null;

      let durationLabel = "Personalized itinerary";
      if (stay && recovery) {
        durationLabel = `${stay} · ${recovery}`;
      } else if (stay) {
        durationLabel = stay;
      } else if (recovery) {
        durationLabel = recovery;
      } else if (primaryProcedure?.duration) {
        durationLabel = primaryProcedure.duration;
      }

      acc.push({
        id: treatment.id,
        slug: treatment.slug,
        title: treatment.name,
        summary:
          treatment.summary ??
          treatment.description ??
          "World-class medical care tailored to international patients.",
        priceLabel:
          typeof basePriceCandidate === "number"
            ? `From ${formatCurrency(basePriceCandidate, treatment.currency)}`
            : "Contact us for pricing",
        durationLabel,
        image: presentation.image,
        Icon: presentation.Icon,
        isFeatured: true,
        priceValue: typeof basePriceCandidate === "number" ? basePriceCandidate : null,
      });

      return acc;
    }, []);

    return prepared
      .sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0))
      .map(({ priceValue, ...rest }) => rest);
  }, [treatments]);

  const handleCardClick = useCallback(
    (slug?: string) => {
      if (!slug) return;
      router.push(`/treatments/${slug}`);
    },
    [router],
  );

  const handleStartJourney = useCallback(
    (event: MouseEvent<HTMLButtonElement>, slug?: string) => {
      event.stopPropagation();
      if (!slug) return;
      router.push(`/start-journey?treatment=${slug}`);
    },
    [router],
  );

  const handleLearnMore = useCallback(
    (event: MouseEvent<HTMLButtonElement>, slug?: string) => {
      event.stopPropagation();
      if (!slug) return;
      router.push(`/treatments/${slug}`);
    },
    [router],
  );

  const handleViewAll = useCallback(() => {
    router.push("/treatments");
  }, [router]);

  const showEmptyState = !loading && !error && featuredTreatments.length === 0;

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured <span className="bg-gradient-hero bg-clip-text text-transparent">Treatments</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular medical procedures, performed by internationally certified specialists
          </p>
        </div>

        <div className={featuredTreatments.length > 4 ? "overflow-x-auto pb-4" : ""}>
          <div
            className={
              featuredTreatments.length > 4
                ? "grid grid-flow-col auto-cols-[minmax(260px,1fr)] md:auto-cols-[minmax(300px,1fr)] gap-8"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            }
          >
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={`featured-skeleton-${index}`} className="border-border/50 overflow-hidden">
                    <div className="h-48 bg-muted animate-pulse" />
                    <CardHeader>
                      <div className="h-6 bg-muted animate-pulse rounded w-2/3 mb-3" />
                      <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
                      <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-10 bg-muted animate-pulse rounded mb-4" />
                      <div className="h-10 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))
              : featuredTreatments.map((treatment) => {
                  const { Icon } = treatment;

                  return (
                    <Card
                      key={treatment.id}
                      className="group hover:shadow-elegant transition-spring cursor-pointer border-border/50 overflow-hidden"
                      onClick={() => handleCardClick(treatment.slug)}
                    >
                      {treatment.isFeatured && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground text-center">
                            Featured
                          </Badge>
                        </div>
                      )}

                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={treatment.image}
                          alt={treatment.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-spring"
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <Icon className="h-8 w-8 text-accent" />
                        </div>
                      </div>

                      <CardHeader>
                        <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                          {treatment.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {treatment.summary}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-2xl font-bold text-primary">{treatment.priceLabel}</p>
                            <p className="text-sm text-muted-foreground">{treatment.durationLabel}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button className="w-full" onClick={(event) => handleStartJourney(event, treatment.slug)}>
                            Start Your Journey
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full hover:bg-primary hover:text-primary-foreground transition-smooth"
                            onClick={(event) => handleLearnMore(event, treatment.slug)}
                          >
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </div>

        {error ? (
          <p className="text-center text-destructive mt-10">
            Unable to load featured treatments right now. Please try again shortly.
          </p>
        ) : null}

        {showEmptyState ? (
          <p className="text-center text-muted-foreground mt-10">
            Mark treatments as featured in the admin dashboard to spotlight them here.
          </p>
        ) : null}

        <div className="text-center mt-12">
          <Button size="lg" variant="default" onClick={handleViewAll}>
            View All Treatments
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTreatments;
