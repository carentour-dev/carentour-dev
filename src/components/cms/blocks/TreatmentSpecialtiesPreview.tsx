"use client";

import { useMemo } from "react";
import { useTreatments } from "@/hooks/useTreatments";
import type { BlockInstance } from "@/lib/cms/blocks";
import {
  resolveTreatmentCardImage,
  selectPrimaryProcedure,
} from "@/lib/treatments";
import { BlockSurface } from "./BlockSurface";
import { TreatmentSpecialtiesCatalog } from "./TreatmentSpecialtiesCatalog";

function selectPreviewTreatments(
  treatments: ReturnType<typeof useTreatments>["treatments"],
  block: BlockInstance<"treatmentSpecialties">,
) {
  const manual = (block.manualTreatments ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (manual.length > 0) {
    const orderMap = new Map(manual.map((slug, index) => [slug, index]));

    return treatments
      .filter(
        (treatment) =>
          treatment.isActive !== false &&
          treatment.isListedPublic !== false &&
          (manual.includes(treatment.slug) || manual.includes(treatment.id)),
      )
      .sort((a, b) => {
        const rankA = orderMap.get(a.slug) ?? orderMap.get(a.id) ?? 9999;
        const rankB = orderMap.get(b.slug) ?? orderMap.get(b.id) ?? 9999;
        return rankA - rankB;
      })
      .slice(0, block.limit);
  }

  const categorySet = new Set(
    (block.categories ?? []).map((entry) => entry.trim()).filter(Boolean),
  );

  const filtered = treatments.filter(
    (treatment) =>
      treatment.isActive !== false &&
      treatment.isListedPublic !== false &&
      (block.featuredOnly ? treatment.isFeatured === true : true) &&
      (categorySet.size === 0 ||
        (treatment.category ? categorySet.has(treatment.category) : false)),
  );

  return filtered.slice(0, block.limit);
}

export function TreatmentSpecialtiesPreview({
  block,
}: {
  block: BlockInstance<"treatmentSpecialties">;
}) {
  const { treatments } = useTreatments();

  const cards = useMemo(() => {
    return selectPreviewTreatments(treatments, block).map((treatment) => {
      const override = (block.overrides ?? []).find(
        (entry) => entry.treatmentSlug === treatment.slug,
      );
      const cardImage = resolveTreatmentCardImage({
        slug: treatment.slug,
        category: treatment.category,
        cardImageUrl: treatment.cardImageUrl,
      });
      const primaryProcedure = selectPrimaryProcedure(treatment.procedures);
      const basePriceValue =
        typeof treatment.basePrice === "number"
          ? treatment.basePrice
          : (primaryProcedure?.egyptPrice ?? null);

      return {
        id: treatment.id,
        slug: treatment.slug,
        title: treatment.name,
        summary:
          override?.summary?.trim() ||
          treatment.summary ||
          treatment.description ||
          "World-class treatment delivered by accredited specialists.",
        description:
          override?.description?.trim() ||
          treatment.overview ||
          treatment.description ||
          undefined,
        basePrice: basePriceValue,
        currency: treatment.currency || "USD",
        image: cardImage.image,
        fallbackImage: cardImage.fallbackImage,
      };
    });
  }, [block, treatments]);

  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/50 bg-background dark:border-slate-200 dark:bg-slate-50"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <TreatmentSpecialtiesCatalog
          eyebrow={block.eyebrow}
          heading={block.heading}
          description={block.description}
          showSearch={block.showSearch}
          searchPlaceholder={block.searchPlaceholder}
          emptyStateHeading={block.emptyStateHeading}
          emptyStateDescription={block.emptyStateDescription}
          priceLabel={block.priceLabel}
          primaryActionLabel={block.primaryActionLabel}
          secondaryActionLabel={block.secondaryActionLabel}
          cards={cards}
        />
      )}
    </BlockSurface>
  );
}
