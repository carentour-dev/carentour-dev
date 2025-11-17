import type { BlockInstance } from "@/lib/cms/blocks";
import { TabbedGuideContent } from "./TabbedGuideContent";

export function TabbedGuidePreview({
  block,
}: {
  block: BlockInstance<"tabbedGuide">;
}) {
  return <TabbedGuideContent block={block} hotelMap={{}} isPreview />;
}
