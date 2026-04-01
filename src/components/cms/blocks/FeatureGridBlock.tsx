import { getLocale } from "next-intl/server";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { FeatureGridBlockContent } from "./FeatureGridBlockContent";

export async function FeatureGridBlock({
  block,
}: {
  block: BlockInstance<"featureGrid">;
}) {
  const locale = (await getLocale()) as PublicLocale;

  return <FeatureGridBlockContent block={block} locale={locale} />;
}
