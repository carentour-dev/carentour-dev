import type { BlockInstance } from "@/lib/cms/blocks";
import { FeaturedTreatmentsSection } from "@/components/home";
import { getTreatmentsForBlock } from "@/lib/cms/server";
import { BlockSurface } from "./BlockSurface";
import { withBlockStyleDefaults } from "./blockStyleDefaults";

export async function FeaturedTreatmentsHomeBlock({
  block,
}: {
  block: BlockInstance<"featuredTreatmentsHome">;
}) {
  const blockWithStyle = withBlockStyleDefaults(block, {
    background: {
      variant: "solid",
      color: {
        base: "hsl(var(--home-section-band))",
      },
    },
  });
  const treatments = await getTreatmentsForBlock({
    manualTreatments: blockWithStyle.manualTreatments,
    limit: blockWithStyle.limit,
    featuredOnly: blockWithStyle.featuredOnly,
    categories: undefined,
  });

  return (
    <BlockSurface
      block={blockWithStyle}
      className="overflow-visible border-y border-border/50 dark:!bg-[#181C25]"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <FeaturedTreatmentsSection
          embedded
          treatments={treatments}
          eyebrow={blockWithStyle.eyebrow}
          title={blockWithStyle.title}
          description={blockWithStyle.description}
          appearance={blockWithStyle.cardAppearance}
        />
      )}
    </BlockSurface>
  );
}
