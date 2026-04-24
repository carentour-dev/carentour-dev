import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { AnimationController } from "@/components/cms/AnimationController";
import { CallToActionBlock } from "@/components/cms/blocks/CallToActionBlock";
import { FaqBlock } from "@/components/cms/blocks/FaqBlock";
import { FeaturedTreatmentsHomeBlock } from "@/components/cms/blocks/FeaturedTreatmentsHomeBlock";
import { FeatureGridBlock } from "@/components/cms/blocks/FeatureGridBlock";
import { HomeHeroBlock } from "@/components/cms/blocks/HomeHeroBlock";
import { StatGridBlock } from "@/components/cms/blocks/StatGridBlock";
import { StoryNarrativeBlock } from "@/components/cms/blocks/StoryNarrativeBlock";
import { TrustSignalsBlock } from "@/components/cms/blocks/TrustSignalsBlock";

const OPTIMIZED_HOME_BLOCK_TYPES = new Set([
  "homeHero",
  "statGrid",
  "storyNarrative",
  "featuredTreatmentsHome",
  "featureGrid",
  "trustSignals",
  "faq",
  "callToAction",
]);

export function supportsOptimizedHomeBlocks(blocks: unknown) {
  return normalizeBlocks(blocks).every((block) =>
    OPTIMIZED_HOME_BLOCK_TYPES.has(block.type),
  );
}

type HomeBlockRendererProps = {
  blocks: unknown;
  className?: string;
  locale?: PublicLocale;
};

export function HomeBlockRenderer({
  blocks,
  className,
  locale = "en",
}: HomeBlockRendererProps) {
  const parsedBlocks = normalizeBlocks(blocks);

  if (!parsedBlocks.length) {
    return null;
  }

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block: BlockInstance) => {
          const key = block.blockId;
          switch (block.type) {
            case "homeHero":
              return <HomeHeroBlock key={key} block={block} locale={locale} />;
            case "statGrid":
              return <StatGridBlock key={key} block={block} locale={locale} />;
            case "storyNarrative":
              return (
                <StoryNarrativeBlock key={key} block={block} locale={locale} />
              );
            case "featuredTreatmentsHome":
              return (
                <FeaturedTreatmentsHomeBlock
                  key={key}
                  block={block}
                  locale={locale}
                />
              );
            case "featureGrid":
              return (
                <FeatureGridBlock key={key} block={block} locale={locale} />
              );
            case "trustSignals":
              return (
                <TrustSignalsBlock key={key} block={block} locale={locale} />
              );
            case "faq":
              return <FaqBlock key={key} block={block} />;
            case "callToAction":
              return (
                <CallToActionBlock key={key} block={block} locale={locale} />
              );
            default:
              return null;
          }
        })}
      </div>
      <AnimationController />
    </>
  );
}

export default HomeBlockRenderer;
