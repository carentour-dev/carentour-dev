"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { FeaturedTreatmentsSection } from "@/components/home";
import { buildFeaturedTreatmentCards } from "@/components/home/featuredTreatmentCards";
import { useTreatments } from "@/hooks/useTreatments";
import type { PublicLocale } from "@/i18n/routing";

const FeaturedTreatments = () => {
  const locale = useLocale() as PublicLocale;
  const { treatments, loading, error } = useTreatments();

  const featuredTreatments = useMemo(
    () =>
      treatments.filter(
        (treatment) =>
          treatment.isActive !== false &&
          treatment.isFeatured === true &&
          treatment.isListedPublic !== false,
      ),
    [treatments],
  );
  const cards = useMemo(
    () => buildFeaturedTreatmentCards(featuredTreatments, locale),
    [featuredTreatments, locale],
  );

  return (
    <FeaturedTreatmentsSection
      cards={cards}
      locale={locale}
      loading={loading}
      error={error}
    />
  );
};

export default FeaturedTreatments;
