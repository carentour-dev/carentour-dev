"use client";

import type { BlockInstance } from "@/lib/cms/blocks";
import { blockRegistry, normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { AnimationController } from "./AnimationController";
import { CallToActionBlock } from "./blocks/CallToActionBlock";
import { FeatureGridBlock } from "./blocks/FeatureGridBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { HeroBlock } from "./blocks/HeroBlock";
import { ImageFeatureBlock } from "./blocks/ImageFeatureBlock";
import { LogoGridBlock } from "./blocks/LogoGridBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { StatGridBlock } from "./blocks/StatGridBlock";
import { TabbedGuidePreview } from "./blocks/TabbedGuidePreview";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-6 text-sm text-muted-foreground">
      {title} preview available on published page.
    </div>
  );
}

function isBlockInstance(candidate: unknown): candidate is BlockInstance {
  if (!candidate || typeof candidate !== "object") return false;
  const typed = candidate as { type?: string; blockId?: unknown };
  return (
    typeof typed.type === "string" &&
    typed.type in blockRegistry &&
    typeof typed.blockId === "string" &&
    typed.blockId.length > 0
  );
}

function isBlockLike(candidate: unknown): candidate is { type?: string } {
  if (!candidate || typeof candidate !== "object") return false;
  const typed = candidate as { type?: string };
  return typeof typed.type === "string" && typed.type in blockRegistry;
}

function ensureBlockInstances(blocks: unknown): BlockInstance[] {
  if (Array.isArray(blocks)) {
    if (blocks.every((candidate) => isBlockInstance(candidate))) {
      return blocks as BlockInstance[];
    }
    if (blocks.every((candidate) => isBlockLike(candidate))) {
      return normalizeBlocks(blocks);
    }
  }
  return normalizeBlocks(blocks);
}

function stableHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getBlockKey(block: BlockInstance): string {
  const contentSignature = stableHash(JSON.stringify(block));
  return `${block.blockId}-${contentSignature}`;
}

export function BlockPreviewRenderer({
  blocks,
  className,
  disableAnimations,
}: {
  blocks: unknown;
  className?: string;
  disableAnimations?: boolean;
}) {
  const parsedBlocks = ensureBlockInstances(blocks);

  if (!parsedBlocks.length) return null;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block) => {
          const blockKey = getBlockKey(block);
          switch (block.type) {
            case "hero":
              return <HeroBlock key={blockKey} block={block} />;
            case "statGrid":
              return <StatGridBlock key={blockKey} block={block} />;
            case "richText":
              return <RichTextBlock key={blockKey} block={block} />;
            case "imageFeature":
              return <ImageFeatureBlock key={blockKey} block={block} />;
            case "featureGrid":
              return <FeatureGridBlock key={blockKey} block={block} />;
            case "logoGrid":
              return <LogoGridBlock key={blockKey} block={block} />;
            case "callToAction":
              return <CallToActionBlock key={blockKey} block={block} />;
            case "faq":
              return <FaqBlock key={blockKey} block={block} />;
            case "quote":
              return <QuoteBlock key={blockKey} block={block} />;
            case "treatments":
              return <Placeholder key={blockKey} title="Treatments" />;
            case "doctors":
              return <Placeholder key={blockKey} title="Doctors" />;
            case "tabbedGuide":
              return (
                <TabbedGuidePreview
                  key={blockKey}
                  block={block as BlockInstance<"tabbedGuide">}
                />
              );
            default:
              return (
                <pre
                  key={blockKey}
                  className="max-w-full overflow-auto rounded border border-dashed border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground"
                >
                  {JSON.stringify(block, null, 2)}
                </pre>
              );
          }
        })}
      </div>
      {disableAnimations ? null : <AnimationController />}
    </>
  );
}

export default BlockPreviewRenderer;
