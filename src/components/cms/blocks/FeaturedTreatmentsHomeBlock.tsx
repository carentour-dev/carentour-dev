import type { BlockInstance } from "@/lib/cms/blocks";
import { FeaturedTreatmentsSection } from "@/components/home";
import { getTreatmentsForBlock } from "@/lib/cms/server";

export async function FeaturedTreatmentsHomeBlock({
  block,
}: {
  block: BlockInstance<"featuredTreatmentsHome">;
}) {
  const treatments = await getTreatmentsForBlock({
    manualTreatments: block.manualTreatments,
    limit: block.limit,
    featuredOnly: block.featuredOnly,
    categories: undefined,
  });

  return (
    <FeaturedTreatmentsSection
      treatments={treatments}
      title={block.title}
      description={block.description}
    />
  );
}
