"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isRemoteImageUrl } from "@/lib/treatments";

type TreatmentSpecialtyCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  basePrice: number | null;
  currency: string;
  image: string;
  fallbackImage: string;
};

type TreatmentSpecialtiesCatalogProps = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  showSearch: boolean;
  searchPlaceholder: string;
  emptyStateHeading: string;
  emptyStateDescription: string;
  priceLabel: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  cards: TreatmentSpecialtyCard[];
};

const formatCurrency = (value: number, currency?: string) => {
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

export function TreatmentSpecialtiesCatalog({
  eyebrow,
  heading,
  description,
  showSearch,
  searchPlaceholder,
  emptyStateHeading,
  emptyStateDescription,
  priceLabel,
  primaryActionLabel,
  secondaryActionLabel,
  cards,
}: TreatmentSpecialtiesCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFallbackByTreatmentId, setImageFallbackByTreatmentId] = useState<
    Record<string, true>
  >({});
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredCards = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    if (!query) {
      return cards;
    }

    return cards.filter((card) => {
      const haystack = [card.title, card.summary, card.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [cards, deferredSearchTerm]);

  const visibleCards = filteredCards;

  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      setSearchTerm(value);
    });
  }, []);

  const handleCardImageError = useCallback(
    (treatmentId: string, image: string, fallbackImage: string) => {
      if (!isRemoteImageUrl(image) || image === fallbackImage) {
        return;
      }

      setImageFallbackByTreatmentId((current) => {
        if (current[treatmentId]) {
          return current;
        }

        return { ...current, [treatmentId]: true };
      });
    },
    [],
  );

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary dark:border-slate-200 dark:bg-white dark:text-slate-500">
            {eyebrow}
          </span>
        ) : null}
        {heading ? (
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground dark:text-slate-950 md:text-5xl">
            {heading}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-4 text-lg leading-8 text-muted-foreground dark:text-slate-600">
            {description}
          </p>
        ) : null}
      </div>

      {showSearch ? (
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-12 rounded-full border-border/60 bg-background pl-11 shadow-sm dark:border-slate-200 dark:bg-white dark:text-slate-950"
            />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground dark:text-slate-600">
            {searchTerm
              ? `Showing ${visibleCards.length} of ${cards.length} specialties`
              : `Showing ${visibleCards.length} specialties`}
          </p>
        </div>
      ) : null}

      {visibleCards.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-surface-subtle px-6 py-12 text-center dark:border-slate-200 dark:bg-white">
          <h3 className="text-xl font-semibold text-foreground dark:text-slate-950">
            {emptyStateHeading}
          </h3>
          <p className="mt-3 text-muted-foreground dark:text-slate-600">
            {emptyStateDescription}
          </p>
          {searchTerm ? (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
          {visibleCards.map((card) => {
            const basePriceLabel =
              card.basePrice !== null
                ? formatCurrency(card.basePrice, card.currency)
                : "Contact us for pricing";
            const imageSrc = imageFallbackByTreatmentId[card.id]
              ? card.fallbackImage
              : card.image;
            const summary = card.summary?.trim() || undefined;
            const description = card.description?.trim() || undefined;

            return (
              <Card
                key={card.id}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-border/60 bg-card/95 shadow-[0_18px_42px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-200 dark:bg-white dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={card.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    unoptimized={isRemoteImageUrl(imageSrc)}
                    onError={() =>
                      handleCardImageError(
                        card.id,
                        imageSrc,
                        card.fallbackImage,
                      )
                    }
                  />
                </div>

                <CardHeader className="flex min-h-[12.5rem] items-center justify-center border-b border-slate-200/80 bg-transparent px-6 py-6 text-center">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-foreground dark:text-slate-950">
                      {card.title}
                    </CardTitle>
                    <p className="mx-auto max-w-[32ch] text-base font-medium leading-7 text-slate-600">
                      {summary}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-5">
                  {description ? (
                    <p className="text-sm leading-7 text-slate-600">
                      {description}
                    </p>
                  ) : null}

                  <div className="mt-auto space-y-3">
                    <div className="rounded-[1.5rem] border border-[hsl(210_15%_90%)] bg-[hsl(210_80%_95%)] px-4 py-5 text-center">
                      <p className="text-sm font-medium text-[hsl(210_85%_45%)]">
                        {priceLabel}
                      </p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[hsl(210_85%_45%)]">
                        {basePriceLabel}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-[#1b2432] bg-[#1b2432] text-white hover:bg-[#111827] hover:text-white"
                      >
                        <Link href={`/treatments/${card.slug}`}>
                          {primaryActionLabel}
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href={`/start-journey?treatment=${card.slug}`}>
                          {secondaryActionLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
