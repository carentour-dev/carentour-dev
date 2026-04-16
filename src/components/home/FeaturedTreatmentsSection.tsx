import Image from "@/components/OptimizedImage";
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
import type { NormalizedTreatment } from "@/lib/treatments";
import type { PublicLocale } from "@/i18n/routing";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import { resolveGridImageLoading } from "@/lib/images/loading";
import { cn } from "@/lib/utils";
import {
  buildFeaturedTreatmentCards,
  type FeaturedTreatmentCard,
} from "./featuredTreatmentCards";

export function FeaturedTreatmentsSection({
  cards,
  treatments,
  locale = "en",
  eyebrow,
  title,
  description,
  appearance = "original",
  loading = false,
  error = null,
  embedded = false,
}: {
  cards?: FeaturedTreatmentCard[];
  treatments?: NormalizedTreatment[];
  locale?: PublicLocale;
  eyebrow?: string;
  title?: string;
  description?: string;
  appearance?: "original" | "theme";
  loading?: boolean;
  error?: string | null;
  embedded?: boolean;
}) {
  const isArabicLocale = locale === "ar";
  const resolvedTitle =
    title ?? (isArabicLocale ? "العلاجات المميزة" : "Featured Treatments");
  const resolvedDescription =
    description ??
    (isArabicLocale
      ? "اكتشف أكثر الإجراءات الطبية طلباً لدينا، والتي ينفذها متخصصون معتمدون دولياً."
      : "Discover our most popular medical procedures, performed by internationally certified specialists");
  const featuredBadgeLabel = isArabicLocale ? "مميز" : "Featured";
  const primaryActionLabel = isArabicLocale
    ? "ابدأ رحلتك"
    : "Start Your Journey";
  const secondaryActionLabel = isArabicLocale ? "اعرف المزيد" : "Learn More";
  const itineraryLabel = isArabicLocale ? "الخطة العلاجية" : "Itinerary";
  const successRateLabel = isArabicLocale ? "نسبة النجاح" : "Success rate";
  const investmentLabel = isArabicLocale ? "التكلفة" : "Investment";
  const viewTreatmentLabel = isArabicLocale ? "عرض العلاج" : "View treatment";
  const planJourneyLabel = isArabicLocale ? "خطط رحلتك" : "Plan journey";
  const errorLabel = isArabicLocale
    ? "تعذر تحميل العلاجات المميزة حالياً. حاول مرة أخرى بعد قليل."
    : "Unable to load featured treatments right now. Please try again shortly.";
  const emptyStateLabel = isArabicLocale
    ? "ستظهر العلاجات المميزة هنا بمجرد توفرها."
    : "Featured treatments will appear here once they are available.";

  const featuredTreatments =
    cards ?? buildFeaturedTreatmentCards(treatments ?? [], locale);
  const showEmptyState = !loading && !error && featuredTreatments.length === 0;
  const usesOriginalAppearance = appearance === "original";
  const needsHorizontalScroll =
    !usesOriginalAppearance && featuredTreatments.length > 4;
  const needsWrappedDesktopLayout =
    usesOriginalAppearance && featuredTreatments.length > 4;

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
        {resolvedTitle ? (
          <h2 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">
            {resolvedTitle}
          </h2>
        ) : null}
        {resolvedDescription ? (
          <p
            className={
              usesOriginalAppearance
                ? "mt-4 text-xl text-muted-foreground"
                : "mt-2 text-muted-foreground"
            }
          >
            {resolvedDescription}
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
              : featuredTreatments.map((treatment, index) => {
                  const learnMoreContextSuffix = isArabicLocale
                    ? ` حول ${treatment.title}`
                    : ` about ${treatment.title}`;
                  const viewTreatmentContextSuffix = isArabicLocale
                    ? `: ${treatment.title}`
                    : `: ${treatment.title}`;

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
                                {featuredBadgeLabel}
                              </Badge>
                            </div>
                          ) : null}
                          <Image
                            src={treatment.image}
                            alt={treatment.title}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover/featured:scale-[1.04]"
                            loading={resolveGridImageLoading(index, {
                              eagerCount: embedded
                                ? 0
                                : needsHorizontalScroll
                                  ? 1
                                  : 3,
                            })}
                            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
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
                                  href={`${localizePublicPathnameWithFallback("/start-journey", locale)}?treatment=${treatment.slug}`}
                                  aria-label={`${planJourneyLabel}: ${treatment.title}`}
                                >
                                  {primaryActionLabel}
                                  <ArrowRight
                                    className={cn(
                                      "h-4 w-4 transition-transform duration-300 group-hover/featured:translate-x-1",
                                      isArabicLocale
                                        ? "mr-2 rotate-180"
                                        : "ml-2",
                                    )}
                                  />
                                </Link>
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                className="h-10 w-full border-border bg-background text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Link
                                  href={localizePublicPathname(
                                    `/treatments/${treatment.slug}`,
                                    locale,
                                  )}
                                >
                                  {secondaryActionLabel}
                                  <span className="sr-only">
                                    {learnMoreContextSuffix}
                                  </span>
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
                            {featuredBadgeLabel}
                          </Badge>
                        ) : null}
                        <CardDescription className="text-sm text-muted-foreground">
                          {treatment.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between text-xs">
                          <span>{itineraryLabel}</span>
                          <span className="text-foreground">
                            {treatment.durationLabel}
                          </span>
                        </div>
                        {treatment.successRate ? (
                          <div className="flex items-center justify-between text-xs">
                            <span>{successRateLabel}</span>
                            <span className="text-foreground">
                              {treatment.successRate}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between text-xs">
                          <span>{investmentLabel}</span>
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
                            <Link
                              href={localizePublicPathname(
                                `/treatments/${treatment.slug}`,
                                locale,
                              )}
                            >
                              {viewTreatmentLabel}
                              <span className="sr-only">
                                {viewTreatmentContextSuffix}
                              </span>
                            </Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Link
                              href={`${localizePublicPathnameWithFallback("/start-journey", locale)}?treatment=${treatment.slug}`}
                              aria-label={`${planJourneyLabel}: ${treatment.title}`}
                            >
                              {planJourneyLabel}
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
        <p className="mt-10 text-center text-destructive">{errorLabel}</p>
      ) : null}

      {showEmptyState ? (
        <p
          className={
            usesOriginalAppearance
              ? "mt-10 text-center text-slate-500"
              : "mt-10 text-center text-muted-foreground"
          }
        >
          {emptyStateLabel}
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
