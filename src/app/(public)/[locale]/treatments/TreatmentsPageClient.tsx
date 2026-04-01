"use client";

import type { ComponentType } from "react";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTreatments } from "@/hooks/useTreatments";
import { useDoctors } from "@/hooks/useDoctors";
import PriceComparison from "@/components/PriceComparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  buildPriceComparison,
  isRemoteImageUrl,
  resolveTreatmentCardImage,
  selectPrimaryProcedure,
} from "@/lib/treatments";
import type { PublicLocale } from "@/i18n/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Scissors,
  Smile,
  Stethoscope,
  Users,
  Search,
} from "lucide-react";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "cardiac-surgery": Heart,
  "heart surgery": Heart,
  cardiology: Heart,
  "eye-surgery": Eye,
  ophthalmology: Eye,
  "dental-care": Smile,
  dental: Smile,
  dentistry: Smile,
  "cosmetic-surgery": Scissors,
  cosmetic: Scissors,
  "general-surgery": Stethoscope,
  general: Stethoscope,
  "orthopedic-surgery": Activity,
  orthopedic: Activity,
};

const formatCurrency = (
  value: number,
  currency: string | undefined,
  locale: PublicLocale,
) => {
  try {
    return new Intl.NumberFormat(getPublicNumberLocale(locale), {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `$${new Intl.NumberFormat(getPublicNumberLocale(locale)).format(value)}`;
  }
};

export default function Treatments() {
  const t = useTranslations("TreatmentsPage");
  const locale = useLocale() as PublicLocale;
  const router = useRouter();
  const { treatments, loading, error } = useTreatments();
  const { doctors } = useDoctors();
  const [expandedComparison, setExpandedComparison] = useState<string | null>(
    null,
  );
  const [imageFallbackByTreatmentId, setImageFallbackByTreatmentId] = useState<
    Record<string, true>
  >({});
  const [searchTerm, setSearchTerm] = useState("");

  const visibleTreatments = useMemo(
    () =>
      treatments.filter(
        (treatment) =>
          treatment.isListedPublic !== false && treatment.isActive !== false,
      ),
    [treatments],
  );

  const cards = useMemo(() => {
    return visibleTreatments.map((treatment) => {
      const iconKey = treatment.slug || treatment.category || "";
      const Icon = iconMap[iconKey.toLowerCase()] || Stethoscope;
      const cardImage = resolveTreatmentCardImage({
        slug: treatment.slug,
        category: treatment.category,
        cardImageUrl: treatment.cardImageUrl,
      });

      const dbComparison = buildPriceComparison(treatment.procedures);
      const comparison = dbComparison ?? null;

      const primaryProcedure = selectPrimaryProcedure(treatment.procedures);

      const basePriceValue =
        typeof treatment.basePrice === "number"
          ? treatment.basePrice
          : (primaryProcedure?.egyptPrice ?? null);

      return {
        id: treatment.id,
        slug: treatment.slug,
        title: treatment.name,
        icon: Icon,
        summary:
          treatment.summary || treatment.description || t("fallbackSummary"),
        description: treatment.overview || treatment.description || undefined,
        basePrice: basePriceValue,
        currency: treatment.currency || "USD",
        isActive: treatment.isActive !== false,
        image: cardImage.image,
        fallbackImage: cardImage.fallbackImage,
        comparison,
      };
    });
  }, [t, visibleTreatments]);

  const filteredCards = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

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
  }, [cards, searchTerm]);

  const comparisonEntries = cards.filter((card) => card.comparison);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(getPublicNumberLocale(locale)),
    [locale],
  );

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

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {t("errorLoading", { error })}
            </p>
            <Button onClick={() => window.location.reload()}>
              {t("tryAgain")}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="bg-surface-subtle py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                {t("heroBadge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                {t("heroTitleLead")}
                <span className="block text-primary">
                  {t("heroTitleAccent")}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t("heroDescription")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("specialtiesHeading")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("specialtiesDescription")}
              </p>
            </div>

            <div className="max-w-3xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {searchTerm
                  ? t("showingFiltered", {
                      filtered: numberFormatter.format(filteredCards.length),
                      total: numberFormatter.format(cards.length),
                    })
                  : t("showingAll", {
                      total: numberFormatter.format(cards.length),
                    })}
              </p>
            </div>

            {filteredCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm ? t("noSearchResults") : t("noPublished")}
                </p>
                {searchTerm ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    {t("clearSearch")}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCards.map((category) => {
                  const Icon = category.icon;
                  const basePriceLabel =
                    category.basePrice !== null
                      ? formatCurrency(
                          category.basePrice,
                          category.currency,
                          locale,
                        )
                      : t("contactPricing");
                  const imageSrc = imageFallbackByTreatmentId[category.id]
                    ? category.fallbackImage
                    : category.image;

                  return (
                    <Card
                      key={category.id}
                      className="border-border/50 hover:shadow-card-hover transition-spring group overflow-hidden"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={category.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-spring"
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          unoptimized={isRemoteImageUrl(imageSrc)}
                          onError={() =>
                            handleCardImageError(
                              category.id,
                              imageSrc,
                              category.fallbackImage,
                            )
                          }
                        />
                      </div>

                      <CardHeader className="text-center">
                        <Icon className="h-8 w-8 text-primary mx-auto mb-4" />
                        <CardTitle className="text-xl font-bold text-foreground">
                          {category.title}
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">
                          {category.summary}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {category.description ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {category.description}
                            </p>
                          ) : null}

                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                            <p className="text-sm font-medium text-primary mb-1">
                              {t("startingAt")}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {basePriceLabel}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  localizePublicPathname(
                                    `/treatments/${category.slug}`,
                                    locale,
                                  ),
                                )
                              }
                            >
                              {t("learnMore")}
                            </Button>

                            <Button
                              className="w-full"
                              onClick={() =>
                                router.push(
                                  `${localizePublicPathnameWithFallback(
                                    "/start-journey",
                                    locale,
                                  )}?treatment=${category.slug}`,
                                )
                              }
                            >
                              {t("startJourney")}
                            </Button>

                            {category.comparison ? (
                              <Button
                                className="w-full"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedComparison(
                                    expandedComparison === category.id
                                      ? null
                                      : category.id,
                                  )
                                }
                              >
                                {expandedComparison === category.id ? (
                                  <>
                                    {t("hidePriceComparison")}
                                    <ChevronUp className="ml-2 h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    {t("viewSavings")}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            ) : null}
                          </div>

                          {expandedComparison === category.id &&
                            category.comparison && (
                              <div className="mt-4">
                                <PriceComparison
                                  treatment={category.title}
                                  egyptPrice={category.comparison.egyptPrice}
                                  internationalPrices={
                                    category.comparison.internationalPrices
                                  }
                                />
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("whyEgyptHeading")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("whyEgyptDescription")}
              </p>
            </div>

            {comparisonEntries.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {comparisonEntries.slice(0, 2).map((entry) => (
                  <PriceComparison
                    key={entry.id}
                    treatment={entry.title}
                    egyptPrice={entry.comparison!.egyptPrice}
                    internationalPrices={entry.comparison!.internationalPrices}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                {t("noComparison")}
              </div>
            )}

            <div className="text-center mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">
                    75%
                  </div>
                  <div className="text-foreground font-semibold mb-1">
                    {t("statsAverageSavingsTitle")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("statsAverageSavingsDescription")}
                  </div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">
                    $15K+
                  </div>
                  <div className="text-foreground font-semibold mb-1">
                    {t("statsMoneySavedTitle")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("statsMoneySavedDescription")}
                  </div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">
                    5000+
                  </div>
                  <div className="text-foreground font-semibold mb-1">
                    {t("statsHappyPatientsTitle")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("statsHappyPatientsDescription")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("specialistsHeading")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("specialistsDescription")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>
                  {t("specialistsAvailable", {
                    count: numberFormatter.format(doctors.length),
                  })}
                </span>
              </div>
              <Link
                href={localizePublicPathnameWithFallback("/doctors", locale)}
              >
                <Button size="lg" variant="outline">
                  {t("browseAllDoctors")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-surface-brand py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              {t("ctaHeading")}
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              {t("ctaDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="premium" asChild>
                <Link
                  href={localizePublicPathnameWithFallback(
                    "/consultation",
                    locale,
                  )}
                >
                  {t("getFreeConsultation")}
                </Link>
              </Button>
              <Button size="lg" variant="hero" asChild>
                <Link
                  href={localizePublicPathnameWithFallback(
                    "/start-journey",
                    locale,
                  )}
                >
                  {t("startJourney")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
