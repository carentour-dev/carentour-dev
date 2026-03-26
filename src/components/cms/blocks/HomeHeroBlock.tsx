import type { BlockInstance } from "@/lib/cms/blocks";
import { HomeHeroSection } from "@/components/home";

export function HomeHeroBlock({ block }: { block: BlockInstance<"homeHero"> }) {
  return (
    <HomeHeroSection
      content={{
        eyebrow: block.eyebrow,
        headingPrefix: block.headingPrefix,
        headingHighlight: block.headingHighlight,
        headingSuffix: block.headingSuffix,
        description: block.description,
        backgroundImageUrl: block.backgroundImageUrl,
        primaryAction: block.primaryAction,
        secondaryAction: block.secondaryAction,
      }}
    />
  );
}
