"use client";

import type { BlockValue } from "@/lib/cms/blocks";
import { normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { HeroBlock } from "./blocks/HeroBlock";
import { StatGridBlock } from "./blocks/StatGridBlock";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { ImageFeatureBlock } from "./blocks/ImageFeatureBlock";
import { FeatureGridBlock } from "./blocks/FeatureGridBlock";
import { CallToActionBlock } from "./blocks/CallToActionBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-6 text-sm text-muted-foreground">
      {title} preview available on published page.
    </div>
  );
}

export function BlockPreviewRenderer({ blocks, className }: { blocks: unknown; className?: string }) {
  const parsedBlocks = normalizeBlocks(blocks);

  if (!parsedBlocks.length) return null;

  return (
    <div className={cn("flex flex-col", className)}>
      {parsedBlocks.map((block, index) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={`hero-${index}`} block={block} />;
          case "statGrid":
            return <StatGridBlock key={`statGrid-${index}`} block={block} />;
          case "richText":
            return <RichTextBlock key={`richText-${index}`} block={block} />;
          case "imageFeature":
            return <ImageFeatureBlock key={`imageFeature-${index}`} block={block} />;
          case "featureGrid":
            return <FeatureGridBlock key={`featureGrid-${index}`} block={block} />;
          case "callToAction":
            return <CallToActionBlock key={`cta-${index}`} block={block} />;
          case "faq":
            return <FaqBlock key={`faq-${index}`} block={block} />;
          case "quote":
            return <QuoteBlock key={`quote-${index}`} block={block} />;
          case "treatments":
            return <Placeholder key={`treatments-${index}`} title="Treatments" />;
          case "doctors":
            return <Placeholder key={`doctors-${index}`} title="Doctors" />;
          default:
            return (
              <pre
                key={`unknown-${index}`}
                className="max-w-full overflow-auto rounded border border-dashed border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground"
              >
                {JSON.stringify(block, null, 2)}
              </pre>
            );
        }
      })}
    </div>
  );
}

export default BlockPreviewRenderer;
