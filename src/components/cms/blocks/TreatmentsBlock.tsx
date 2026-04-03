import type { BlockInstance } from "@/lib/cms/blocks";
import { getTreatmentsForBlock } from "@/lib/cms/server";

import { TreatmentsBlockContent } from "./TreatmentsBlockContent";

export async function TreatmentsBlock({
  block,
}: {
  block: BlockInstance<"treatments">;
}) {
  const treatments = await getTreatmentsForBlock(block);

  if (!treatments.length) {
    return null;
  }

  return <TreatmentsBlockContent block={block} treatments={treatments} />;
}
