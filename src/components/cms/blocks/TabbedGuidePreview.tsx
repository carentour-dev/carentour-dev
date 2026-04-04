import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { TabbedGuideContent } from "./TabbedGuideContent";

export function TabbedGuidePreview({
  block,
  locale = "en",
}: {
  block: BlockInstance<"tabbedGuide">;
  locale?: PublicLocale;
}) {
  return (
    <TabbedGuideContent block={block} hotelMap={{}} isPreview locale={locale} />
  );
}
