import type { BlockInstance } from "@/lib/cms/blocks";
import { HomeCtaSection } from "@/components/home";

export function HomeCtaBlock({ block }: { block: BlockInstance<"homeCta"> }) {
  return (
    <HomeCtaSection
      content={{
        headingPrefix: block.headingPrefix,
        headingHighlight: block.headingHighlight,
        description: block.description,
        primaryAction: block.primaryAction,
        secondaryAction: block.secondaryAction,
      }}
    />
  );
}
