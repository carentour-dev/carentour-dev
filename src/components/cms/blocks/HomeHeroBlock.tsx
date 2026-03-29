import type { BlockInstance } from "@/lib/cms/blocks";
import { HomeHeroSection } from "@/components/home";
import { BlockSurface } from "./BlockSurface";

const HERO_MIN_HEIGHT_CLASS = "min-h-[calc(100svh-4.5rem)]";

export function HomeHeroBlock({ block }: { block: BlockInstance<"homeHero"> }) {
  const highlights = (block.highlights ?? []).map((highlight) => ({
    kicker: highlight.kicker ?? "",
    label: highlight.label ?? "",
  }));

  return (
    <BlockSurface
      block={block}
      className="bg-transparent"
      container={false}
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
      innerSelector=".home-hero__content"
      contentClassName="w-full"
    >
      {() => (
        <HomeHeroSection
          content={{
            eyebrow: block.eyebrow,
            headingPrefix: block.headingPrefix,
            headingHighlight: block.headingHighlight,
            headingSuffix: block.headingSuffix,
            description: block.description,
            highlights,
            backgroundImageUrl: block.backgroundImageUrl,
            overlay: block.overlay,
            primaryAction: block.primaryAction,
            secondaryAction: block.secondaryAction,
          }}
          className={HERO_MIN_HEIGHT_CLASS}
          contentColumnClassName="home-hero__content max-w-5xl"
        />
      )}
    </BlockSurface>
  );
}
