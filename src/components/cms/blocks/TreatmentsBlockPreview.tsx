"use client";

import { useMemo } from "react";

import { useTreatments } from "@/hooks/useTreatments";
import type { BlockInstance } from "@/lib/cms/blocks";
import type { NormalizedTreatment } from "@/lib/treatments";

import { BlockSurface } from "./BlockSurface";
import { TreatmentsBlockContent } from "./TreatmentsBlockContent";

function selectPreviewTreatments(
  treatments: NormalizedTreatment[],
  block: BlockInstance<"treatments">,
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

  return treatments
    .filter((treatment) => {
      if (treatment.isActive === false || treatment.isListedPublic === false) {
        return false;
      }
      if (block.featuredOnly && treatment.isFeatured !== true) {
        return false;
      }
      if (
        block.categories?.length &&
        !block.categories.includes(treatment.category ?? "")
      ) {
        return false;
      }
      return true;
    })
    .slice(0, block.limit);
}

function PreviewState({
  block,
  title,
  description,
}: {
  block: BlockInstance<"treatments">;
  title: string;
  description: string;
}) {
  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-6"
    >
      {() => (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </BlockSurface>
  );
}

export function TreatmentsBlockPreview({
  block,
}: {
  block: BlockInstance<"treatments">;
}) {
  const { treatments, loading, error } = useTreatments();
  const selectedTreatments = useMemo(
    () => selectPreviewTreatments(treatments, block),
    [block, treatments],
  );

  if (loading) {
    return (
      <PreviewState
        block={block}
        title="Loading treatments"
        description="Fetching live treatment data for the preview."
      />
    );
  }

  if (error) {
    return (
      <PreviewState
        block={block}
        title="Treatments preview unavailable"
        description={error}
      />
    );
  }

  if (!selectedTreatments.length) {
    return (
      <PreviewState
        block={block}
        title="No treatments available"
        description="Adjust the block filters or publish treatments to populate this section."
      />
    );
  }

  return (
    <TreatmentsBlockContent
      block={block}
      treatments={selectedTreatments}
      locale="en"
    />
  );
}
