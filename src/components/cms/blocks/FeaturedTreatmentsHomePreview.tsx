"use client";

import { useMemo } from "react";
import { FeaturedTreatmentsSection } from "@/components/home";
import { useTreatments } from "@/hooks/useTreatments";
import type { BlockInstance } from "@/lib/cms/blocks";

function selectPreviewTreatments(
  treatments: ReturnType<typeof useTreatments>["treatments"],
  block: BlockInstance<"featuredTreatmentsHome">,
) {
  const manual = (block.manualTreatments ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (manual.length > 0) {
    const orderMap = new Map(manual.map((slug, index) => [slug, index]));

    return treatments
      .filter(
        (treatment) =>
          manual.includes(treatment.slug) || manual.includes(treatment.id),
      )
      .sort((a, b) => {
        const rankA = orderMap.get(a.slug) ?? orderMap.get(a.id) ?? 9999;
        const rankB = orderMap.get(b.slug) ?? orderMap.get(b.id) ?? 9999;
        return rankA - rankB;
      })
      .slice(0, block.limit);
  }

  const filtered = treatments.filter(
    (treatment) =>
      treatment.isActive !== false &&
      treatment.isListedPublic !== false &&
      (block.featuredOnly ? treatment.isFeatured === true : true),
  );

  return filtered.slice(0, block.limit);
}

export function FeaturedTreatmentsHomePreview({
  block,
}: {
  block: BlockInstance<"featuredTreatmentsHome">;
}) {
  const { treatments, loading, error } = useTreatments();

  const selectedTreatments = useMemo(
    () => selectPreviewTreatments(treatments, block),
    [block, treatments],
  );

  return (
    <FeaturedTreatmentsSection
      treatments={selectedTreatments}
      title={block.title}
      description={block.description}
      loading={loading}
      error={error}
    />
  );
}
