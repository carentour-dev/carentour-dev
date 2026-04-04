import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { getTreatmentsForBlock } from "@/lib/cms/server";

import { TreatmentsBlockContent } from "./TreatmentsBlockContent";

export async function TreatmentsBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"treatments">;
  locale?: PublicLocale;
}) {
  const treatments = await getTreatmentsForBlock(block, locale);

  if (!treatments.length) {
    return null;
  }

  return (
    <TreatmentsBlockContent
      block={block}
      treatments={treatments}
      locale={locale}
    />
  );
}
