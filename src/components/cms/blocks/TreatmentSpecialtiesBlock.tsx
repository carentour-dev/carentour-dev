import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { getTreatmentsForBlock } from "@/lib/cms/server";
import {
  resolveTreatmentCardImage,
  selectPrimaryProcedure,
} from "@/lib/treatments";
import { BlockSurface } from "./BlockSurface";
import { TreatmentSpecialtiesCatalog } from "./TreatmentSpecialtiesCatalog";

export async function TreatmentSpecialtiesBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"treatmentSpecialties">;
  locale?: PublicLocale;
}) {
  const treatments = await getTreatmentsForBlock(
    {
      manualTreatments: block.manualTreatments,
      limit: block.limit,
      featuredOnly: block.featuredOnly,
      categories: block.categories,
    },
    locale,
  );

  if (!treatments.length) {
    return null;
  }

  const overrides = new Map(
    (block.overrides ?? []).map((entry) => [entry.treatmentSlug, entry]),
  );

  const cards = treatments.map((treatment) => {
    const override = overrides.get(treatment.slug);
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
