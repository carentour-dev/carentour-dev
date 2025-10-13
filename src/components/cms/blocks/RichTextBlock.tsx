import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BlockSurface } from "./BlockSurface";
import {
  getFirstDefinedResponsiveValue,
  hasResponsiveValue,
} from "./styleUtils";

const widthMap: Record<BlockValue<"richText">["width"], string> = {
  prose: "prose prose-lg dark:prose-invert",
  narrow: "max-w-2xl",
  full: "max-w-none",
};

const alignMap: Record<BlockValue<"richText">["align"], string> = {
  start: "text-left",
  center: "text-center mx-auto",
};

export function RichTextBlock({ block }: { block: BlockInstance<"richText"> }) {
  const cta = block.advanced?.cta;
  const layout = block.style?.layout;
  const hasCustomMaxWidth = hasResponsiveValue(layout?.maxWidth);
  const hasCustomHorizontalAlign = hasResponsiveValue(layout?.horizontalAlign);
  const styleAlignValue = getFirstDefinedResponsiveValue(
    layout?.horizontalAlign,
  );

  const fallbackAlignClass = hasCustomHorizontalAlign
    ? undefined
    : block.align === "center"
      ? alignMap.center
      : cn("mx-auto", alignMap.start);

  const contentClasses = cn(
    "space-y-4",
    hasCustomMaxWidth ? "max-w-none" : widthMap[block.width],
    fallbackAlignClass,
  );

  return (
    <BlockSurface block={block} contentClassName={contentClasses}>
      {() => (
        <>
          <MarkdownRenderer content={block.markdown} className="space-y-4" />
          {cta ? (
            <div
              className={cn(
                "mt-6 flex",
                styleAlignValue === "center"
                  ? "justify-center"
                  : styleAlignValue === "end"
                    ? "justify-end"
                    : block.align === "center"
                      ? "justify-center"
                      : "justify-start",
              )}
            >
              <Button asChild variant={cta.variant ?? "default"} size="lg">
                <Link
                  href={cta.href}
                  target={cta.target ?? "_self"}
                  rel={
                    cta.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                >
                  {cta.label}
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </BlockSurface>
  );
}
