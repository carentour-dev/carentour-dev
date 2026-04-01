import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { FeatureGridBlockContent } from "./FeatureGridBlockContent";

export function FeatureGridBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"featureGrid">;
  locale?: PublicLocale;
}) {
  return <FeatureGridBlockContent block={block} locale={locale} />;
}
