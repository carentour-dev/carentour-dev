import type { BlockInstance } from "@/lib/cms/blocks";
import { normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { AnimationController } from "./AnimationController";
import {
  HeroBlock,
  StatGridBlock,
  RichTextBlock,
  ImageFeatureBlock,
  FeatureGridBlock,
  LogoGridBlock,
  CallToActionBlock,
  FaqBlock,
  QuoteBlock,
  TreatmentsBlock,
  DoctorsBlock,
  TabbedGuideBlock,
} from "./blocks";

interface BlockRendererProps {
  blocks: unknown;
  className?: string;
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  const parsedBlocks = normalizeBlocks(blocks);

  if (!parsedBlocks.length) return null;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block: BlockInstance) => {
          const key = block.blockId;
          switch (block.type) {
            case "hero":
              return <HeroBlock key={key} block={block} />;
            case "statGrid":
              return <StatGridBlock key={key} block={block} />;
            case "richText":
              return <RichTextBlock key={key} block={block} />;
            case "imageFeature":
              return <ImageFeatureBlock key={key} block={block} />;
            case "featureGrid":
              return <FeatureGridBlock key={key} block={block} />;
            case "logoGrid":
              return <LogoGridBlock key={key} block={block} />;
            case "callToAction":
              return <CallToActionBlock key={key} block={block} />;
            case "faq":
              return <FaqBlock key={key} block={block} />;
            case "quote":
              return <QuoteBlock key={key} block={block} />;
            case "treatments":
              return <TreatmentsBlock key={key} block={block} />;
            case "doctors":
              return <DoctorsBlock key={key} block={block} />;
            case "tabbedGuide":
              return <TabbedGuideBlock key={key} block={block} />;
            default:
              return (
                <pre
                  key={key}
                  className="max-w-full overflow-auto rounded border border-dashed border-destructive bg-destructive/10 p-4 text-xs text-destructive"
                >
                  {JSON.stringify(block, null, 2)}
                </pre>
              );
          }
        })}
      </div>
      <AnimationController />
    </>
  );
}

export default BlockRenderer;
