"use client";

import { useMemo } from "react";
import { FeaturedTreatmentsSection } from "@/components/home";
import { useTreatments } from "@/hooks/useTreatments";

const FeaturedTreatments = () => {
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

  return (
    <FeaturedTreatmentsSection
      treatments={featuredTreatments}
      loading={loading}
      error={error}
    />
  );
};

export default FeaturedTreatments;
