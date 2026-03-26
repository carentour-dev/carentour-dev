"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type FeaturedTreatmentCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceLabel: string;
  durationLabel: string;
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

    const basePriceCandidate =
      typeof treatment.basePrice === "number"
        ? treatment.basePrice
        : (primaryProcedure?.egyptPrice ?? null);

    const stay =
      typeof treatment.durationDays === "number" &&
      Number.isFinite(treatment.durationDays)
        ? `${treatment.durationDays} day${treatment.durationDays === 1 ? "" : "s"}`
        : null;

    const recovery =
      typeof treatment.recoveryTimeDays === "number" &&
      Number.isFinite(treatment.recoveryTimeDays)
        ? `${treatment.recoveryTimeDays} day${treatment.recoveryTimeDays === 1 ? "" : "s"} recovery`
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
      image: cardImage.image,
      fallbackImage: cardImage.fallbackImage,
      isFeatured: treatment.isFeatured === true,
    });

    return acc;
  }, []);
}

export function FeaturedTreatmentsSection({
  treatments,
  title = "Featured Treatments",
  description = "Discover our most popular medical procedures, performed by internationally certified specialists",
  loading = false,
  error = null,
}: {
  treatments: NormalizedTreatment[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
}) {
  const router = useRouter();
  const [imageFallbackByTreatmentId, setImageFallbackByTreatmentId] = useState<
    Record<string, true>
  >({});

  const featuredTreatments = useMemo(
    () => buildFeaturedTreatmentCards(treatments),
    [treatments],
  );

  const showEmptyState = !loading && !error && featuredTreatments.length === 0;
  const titleSegments = useMemo(() => {
    const trimmed = title.trim();
    const lastSpaceIndex = trimmed.lastIndexOf(" ");
    if (lastSpaceIndex <= 0) {
      return { prefix: trimmed, highlight: "" };
    }
    return {
      prefix: trimmed.slice(0, lastSpaceIndex),
      highlight: trimmed.slice(lastSpaceIndex + 1),
    };
  }, [title]);

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

  return (
    <section className="bg-surface-subtle py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            {titleSegments.prefix}{" "}
            {titleSegments.highlight ? (
              <span className="text-primary">{titleSegments.highlight}</span>
            ) : null}
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={
            featuredTreatments.length > 4 ? "overflow-x-auto pb-4" : ""
          }
        >
          <div
            className={
              featuredTreatments.length > 4
                ? "grid grid-flow-col gap-8 auto-cols-[minmax(260px,1fr)] md:auto-cols-[minmax(300px,1fr)]"
                : "grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            }
          >
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={`featured-skeleton-${index}`}
                    className="overflow-hidden border-border/50"
                  >
                    <div className="h-48 animate-pulse bg-muted" />
                    <CardHeader>
                      <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 h-10 animate-pulse rounded bg-muted" />
                      <div className="h-10 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))
              : featuredTreatments.map((treatment) => {
                  const imageSrc = imageFallbackByTreatmentId[treatment.id]
                    ? treatment.fallbackImage
                    : treatment.image;

                  return (
                    <Card
                      key={treatment.id}
                      className="group cursor-pointer overflow-hidden border-border/50 transition-spring hover:shadow-elegant"
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        router.push(`/treatments/${treatment.slug}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/treatments/${treatment.slug}`);
                        }
                      }}
                    >
                      {treatment.isFeatured ? (
                        <div className="absolute right-4 top-4 z-10">
                          <Badge
                            variant="secondary"
                            className="bg-emphasis-light text-center text-emphasis"
                          >
                            Featured
                          </Badge>
                        </div>
                      ) : null}

                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={treatment.title}
                          fill
                          className="object-cover transition-spring group-hover:scale-105"
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
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

                      <CardHeader>
                        <CardTitle className="text-xl transition-smooth group-hover:text-primary">
                          {treatment.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {treatment.summary}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              {treatment.priceLabel}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {treatment.durationLabel}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button className="w-full" asChild>
                            <Link
                              href={`/start-journey?treatment=${treatment.slug}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              Start Your Journey
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full transition-smooth hover:bg-primary hover:text-primary-foreground"
                            asChild
                          >
                            <Link
                              href={`/treatments/${treatment.slug}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              Learn More
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </div>

        {error ? (
          <p className="mt-10 text-center text-destructive">
            Unable to load featured treatments right now. Please try again
            shortly.
          </p>
        ) : null}

        {showEmptyState ? (
          <p className="mt-10 text-center text-muted-foreground">
            Featured treatments will appear here once they are available.
          </p>
        ) : null}
      </div>
    </section>
  );
}
