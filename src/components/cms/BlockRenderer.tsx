import type { BlockValue } from "@/lib/cms/blocks";
import { normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import {
  HeroBlock,
  StatGridBlock,
  RichTextBlock,
  ImageFeatureBlock,
  FeatureGridBlock,
  CallToActionBlock,
  FaqBlock,
  QuoteBlock,
  TreatmentsBlock,
  DoctorsBlock,
} from "./blocks";

interface BlockRendererProps {
  blocks: unknown;
  className?: string;
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
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
            return <TreatmentsBlock key={`treatments-${index}`} block={block} />;
          case "doctors":
            return <DoctorsBlock key={`doctors-${index}`} block={block} />;
          default:
            return (
              <pre
                key={`unknown-block-${index}`}
                className="max-w-full overflow-auto rounded border border-dashed border-destructive bg-destructive/10 p-4 text-xs text-destructive"
              >
                {JSON.stringify(block, null, 2)}
              </pre>
            );
        }
      })}
    </div>
  );
}

export default BlockRenderer;
