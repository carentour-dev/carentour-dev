"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isRemoteImageUrl,
  resolveTreatmentCardImage,
  selectPrimaryProcedure,
  type NormalizedTreatment,
} from "@/lib/treatments";
import { cn } from "@/lib/utils";

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

const formatDuration = (duration?: number | null) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return `${duration} day${duration === 1 ? "" : "s"}`;
  }
  return null;
};

type FeaturedTreatmentCard = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  summary: string;
  priceLabel: string;
  durationLabel: string;
  successRate?: string | null;
  image: string;
  fallbackImage: string;
  isFeatured: boolean;
};

export function buildFeaturedTreatmentCards(
  treatments: NormalizedTreatment[],
): FeaturedTreatmentCard[] {
  return treatments.reduce<FeaturedTreatmentCard[]>((acc, treatment) => {
    if (!treatment.slug) {
      return acc;
    }

    const cardImage = resolveTreatmentCardImage({
      slug: treatment.slug,
      category: treatment.category,
      cardImageUrl: treatment.cardImageUrl,
    });
    const primaryProcedure = selectPrimaryProcedure(treatment.procedures);
    const stay = formatDuration(treatment.durationDays);
    const recovery = formatDuration(treatment.recoveryTimeDays);

    let durationLabel = primaryProcedure?.duration ?? "Personalized itinerary";
    if (stay && recovery) {
      durationLabel = `${stay} • ${recovery}`;
    } else if (stay) {
      durationLabel = stay;
    } else if (recovery) {
      durationLabel = `${recovery} recovery`;
    }

    const priceCandidate =
      typeof treatment.basePrice === "number"
        ? treatment.basePrice
        : (primaryProcedure?.egyptPrice ?? null);

    acc.push({
      id: treatment.id,
      slug: treatment.slug,
      title: treatment.name,
      category: treatment.category,
      summary:
        treatment.summary ??
        treatment.description ??
        "World-class medical care tailored to international patients.",
      priceLabel:
        typeof priceCandidate === "number"
          ? `From ${formatCurrency(priceCandidate, treatment.currency)}`
          : "Custom pricing",
      durationLabel,
      successRate: primaryProcedure?.successRate ?? null,
      image: cardImage.image,
      fallbackImage: cardImage.fallbackImage,
      isFeatured: treatment.isFeatured === true,
    });

    return acc;
  }, []);
}

export function FeaturedTreatmentsSection({
  treatments,
  eyebrow,
  title = "Featured Treatments",
  description = "Discover our most popular medical procedures, performed by internationally certified specialists",
  appearance = "original",
  loading = false,
  error = null,
  embedded = false,
}: {
  treatments: NormalizedTreatment[];
  eyebrow?: string;
  title?: string;
  description?: string;
  appearance?: "original" | "theme";
  loading?: boolean;
  error?: string | null;
  embedded?: boolean;
}) {
  const [imageFallbackByTreatmentId, setImageFallbackByTreatmentId] = useState<
    Record<string, true>
  >({});

  const featuredTreatments = useMemo(
    () => buildFeaturedTreatmentCards(treatments),
    [treatments],
  );
  const showEmptyState = !loading && !error && featuredTreatments.length === 0;
  const usesOriginalAppearance = appearance === "original";
  const needsHorizontalScroll =
    !usesOriginalAppearance && featuredTreatments.length > 4;
  const needsWrappedDesktopLayout =
    usesOriginalAppearance && featuredTreatments.length > 4;

  const handleCardImageError = (
    treatmentId: string,
    image: string,
    fallbackImage: string,
  ) => {
    if (!isRemoteImageUrl(image) || image === fallbackImage) {
      return;
    }

    setImageFallbackByTreatmentId((current) => {
      if (current[treatmentId]) {
        return current;
      }

      return { ...current, [treatmentId]: true };
    });
  };

  const content = (
    <>
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Badge
              variant="outline"
              className={
                usesOriginalAppearance
                  ? "border-border/60 bg-background/80 text-muted-foreground"
                  : undefined
              }
            >
              {eyebrow}
            </Badge>
          </div>
        ) : null}
        {title ? (
          <h2 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p
            className={
              usesOriginalAppearance
                ? "mt-4 text-xl text-muted-foreground"
                : "mt-2 text-muted-foreground"
            }
          >
            {description}
          </p>
        ) : null}
      </div>

      <div
        className={
          needsHorizontalScroll
            ? "-mx-8 my-[-2.5rem] overflow-visible px-8 py-10"
            : ""
        }
      >
        <div
          className={needsHorizontalScroll ? "overflow-x-auto px-2 py-2" : ""}
        >
          <div
            className={
              usesOriginalAppearance && needsHorizontalScroll
                ? "flex items-stretch gap-6"
                : usesOriginalAppearance
                  ? cn(
                      "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
                      needsWrappedDesktopLayout
                        ? "xl:grid-cols-3"
                        : "xl:grid-cols-4",
                    )
                  : needsHorizontalScroll
                    ? "grid auto-cols-[minmax(300px,1fr)] grid-flow-col gap-8 md:auto-cols-[minmax(360px,1fr)]"
                    : "grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4"
            }
          >
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={`featured-skeleton-${index}`}
                    className={
                      usesOriginalAppearance
                        ? cn(
                            "overflow-hidden border-border/60 bg-card shadow-sm",
                            needsHorizontalScroll &&
                              "w-[300px] flex-none md:w-[320px] xl:w-[340px]",
                          )
                        : "flex h-full w-full flex-col border-border/60 bg-card/90 shadow-sm"
                    }
                  >
                    {usesOriginalAppearance ? (
                      <>
                        <div className="h-40 animate-pulse bg-muted xl:h-44" />
                        <div className="space-y-3 bg-card px-5 py-5">
                          <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="border-t border-border/60 bg-card px-5 py-5">
                          <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
                          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
                          <div className="mt-5 space-y-2.5">
                            <div className="h-10 animate-pulse rounded bg-muted" />
                            <div className="h-10 animate-pulse rounded bg-muted" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <CardHeader>
                          <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-muted" />
                          <div className="mb-2 h-4 w-20 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="h-4 animate-pulse rounded bg-muted" />
                            <div className="h-4 animate-pulse rounded bg-muted" />
                            <div className="h-4 animate-pulse rounded bg-muted" />
                          </div>
                          <div className="mt-6 grid grid-cols-2 gap-2">
                            <div className="h-9 animate-pulse rounded bg-muted" />
                            <div className="h-9 animate-pulse rounded bg-muted" />
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))
              : featuredTreatments.map((treatment) => {
                  const imageSrc = imageFallbackByTreatmentId[treatment.id]
                    ? treatment.fallbackImage
                    : treatment.image;

                  if (usesOriginalAppearance) {
                    return (
                      <Card
                        key={treatment.id}
                        className={cn(
                          "group/featured relative flex h-full flex-col overflow-hidden border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)]",
                          needsHorizontalScroll &&
                            "w-[300px] flex-none md:w-[320px] xl:w-[340px]",
                        )}
                      >
                        <div className="relative h-40 overflow-hidden xl:h-44">
                          {treatment.isFeatured ? (
                            <div className="absolute right-3 top-3 z-10">
                              <Badge
                                variant="outline"
                                className="border-transparent bg-background/92 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.12em] text-primary shadow-sm backdrop-blur-sm hover:bg-background/92 hover:text-primary"
                              >
                                Featured
                              </Badge>
                            </div>
                          ) : null}
                          <Image
                            src={imageSrc}
                            alt={treatment.title}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover/featured:scale-[1.04]"
                            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                            unoptimized={isRemoteImageUrl(imageSrc)}
                            onError={() =>
                              handleCardImageError(
                                treatment.id,
                                imageSrc,
                                treatment.fallbackImage,
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-1 flex-col bg-card">
                          <div className="flex-1 space-y-3 px-5 py-5">
                            <h3 className="text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover/featured:text-primary">
                              {treatment.title}
                            </h3>
                            <p className="text-[0.92rem] leading-7 text-muted-foreground">
                              {treatment.summary}
                            </p>
                          </div>

                          <div className="border-t border-border/60 bg-card px-5 py-5">
                            <p className="text-[1.55rem] font-semibold leading-none tracking-[-0.03em] text-primary">
                              {treatment.priceLabel}
                            </p>
                            <p className="mt-2 text-[0.92rem] text-muted-foreground">
                              {treatment.durationLabel}
                            </p>

                            <div className="mt-5 space-y-2.5">
                              <Button
                                asChild
                                className="h-10 w-full text-sm transition-transform duration-300 group-hover/featured:translate-x-0.5"
                              >
                                <Link
                                  href={`/start-journey?treatment=${treatment.slug}`}
                                >
                                  Start Your Journey
                                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/featured:translate-x-1" />
                                </Link>
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                className="h-10 w-full border-border bg-background text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Link href={`/treatments/${treatment.slug}`}>
                                  Learn More
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <Card
                      key={treatment.id}
                      className="group/featured flex h-full w-full flex-col border-border/60 bg-card/90 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_22px_rgba(59,130,246,0.14)]"
                    >
                      <CardHeader>
                        <CardTitle className="text-xl text-foreground transition-colors duration-300 group-hover/featured:text-primary">
                          {treatment.title}
                        </CardTitle>
                        {treatment.category ? (
                          <Badge
                            variant="secondary"
                            className="w-fit text-xs capitalize"
                          >
                            {treatment.category}
                          </Badge>
                        ) : treatment.isFeatured ? (
                          <Badge variant="secondary" className="w-fit text-xs">
                            Featured
                          </Badge>
                        ) : null}
                        <CardDescription className="text-sm text-muted-foreground">
                          {treatment.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between text-xs">
                          <span>Itinerary</span>
                          <span className="text-foreground">
                            {treatment.durationLabel}
                          </span>
                        </div>
                        {treatment.successRate ? (
                          <div className="flex items-center justify-between text-xs">
                            <span>Success rate</span>
                            <span className="text-foreground">
                              {treatment.successRate}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between text-xs">
                          <span>Investment</span>
                          <span className="text-foreground">
                            {treatment.priceLabel}
                          </span>
                        </div>
                        <div className="mt-auto flex gap-2 pt-2">
                          <Button
                            asChild
                            size="sm"
                            className="flex-1 transition-transform duration-300 group-hover/featured:translate-x-0.5"
                          >
                            <Link href={`/treatments/${treatment.slug}`}>
                              View treatment
                            </Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Link
                              href={`/start-journey?treatment=${treatment.slug}`}
                            >
                              Plan journey
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-10 text-center text-destructive">
          Unable to load featured treatments right now. Please try again
          shortly.
        </p>
      ) : null}

      {showEmptyState ? (
        <p
          className={
            usesOriginalAppearance
              ? "mt-10 text-center text-slate-500"
              : "mt-10 text-center text-muted-foreground"
          }
        >
          Featured treatments will appear here once they are available.
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="bg-surface-subtle py-20">
      <div className="container mx-auto px-4">{content}</div>
    </section>
  );
}
