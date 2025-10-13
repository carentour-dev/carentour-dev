import Image from "next/image";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";

export function QuoteBlock({ block }: { block: BlockInstance<"quote"> }) {
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const alignmentClass =
    styleAlignValue === "center"
      ? "text-center"
      : styleAlignValue === "end"
        ? "text-right"
        : "text-left";
  const attributionAlign =
    alignmentClass === "text-right"
      ? "items-end text-right"
      : alignmentClass === "text-center"
        ? "items-center text-center"
        : "items-start text-left";
  return (
    <BlockSurface
      block={block}
      className="bg-muted/30"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="max-w-4xl"
    >
      {() => (
        <div
          className={cn(
            "rounded-3xl bg-card p-10 shadow-card-hover",
            alignmentClass,
          )}
        >
          {block.eyebrow ? (
            <span className="text-sm uppercase tracking-wide text-primary">
              {block.eyebrow}
            </span>
          ) : null}
          <blockquote className="mt-4 text-2xl font-medium leading-relaxed text-foreground">
            “{block.quote}”
          </blockquote>
          {block.highlight ? (
            <p className="mt-6 text-lg font-semibold text-primary">
              {block.highlight}
            </p>
          ) : null}
          <div
            className={cn(
              "mt-8 flex gap-4",
              alignmentClass === "text-center"
                ? "flex-col items-center"
                : "items-center",
              alignmentClass === "text-right" ? "flex-row-reverse" : undefined,
            )}
          >
            {block.avatar?.src ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={block.avatar.src}
                  alt={block.avatar.alt ?? block.attribution ?? "Avatar"}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className={cn("flex flex-col", attributionAlign)}>
              {block.attribution ? (
                <p className="text-base font-semibold text-foreground">
                  {block.attribution}
                </p>
              ) : null}
              {block.role ? (
                <p className="text-sm text-muted-foreground">{block.role}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </BlockSurface>
  );
}
