import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import {
  getFirstDefinedResponsiveValue,
  hasResponsiveValue,
} from "./styleUtils";

const backgroundMap: Record<BlockValue<"hero">["background"], string> = {
  white: "bg-background",
  muted: "bg-muted/40",
  gradient: "bg-gradient-card",
  primary: "bg-primary text-primary-foreground",
};

const containerWidthMap: Record<BlockValue<"hero">["containerWidth"], string> =
  {
    default: "max-w-5xl",
    wide: "max-w-6xl",
    narrow: "max-w-2xl",
  };

const alignmentMap: Record<BlockValue<"hero">["alignment"], string> = {
  left: "items-start text-left",
  center: "items-center text-center",
};

function ActionLink({
  action,
  variant,
}: {
  action: NonNullable<BlockValue<"hero">["primaryAction"]>;
  variant?: BlockValue<"hero">["primaryAction"]["variant"];
}) {
  const resolvedVariant = variant ?? action.variant ?? "default";
  const target = action.target ?? "_self";
  return (
    <Button
      asChild
      size="lg"
      variant={resolvedVariant === "link" ? "link" : resolvedVariant}
    >
      <Link
        href={action.href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
      >
        {action.label}
      </Link>
    </Button>
  );
}

export function HeroBlock({ block }: { block: BlockValue<"hero"> }) {
  const hasActions = block.primaryAction || block.secondaryAction;
  const hasMedia = Boolean(block.media?.src);
  const layout = block.style?.layout;
  const hasCustomAlign = hasResponsiveValue(layout?.horizontalAlign);
  const styleAlignValue = getFirstDefinedResponsiveValue(
    layout?.horizontalAlign,
  );
  const backgroundVariant = block.style?.background?.variant;
  const useDefaultBackground =
    !backgroundVariant || backgroundVariant === "none";

  return (
    <BlockSurface
      block={block}
      className={
        useDefaultBackground ? backgroundMap[block.background] : undefined
      }
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName={cn(
        "grid gap-10 items-center",
        hasMedia
          ? "lg:grid-cols-2"
          : "lg:grid-cols-[minmax(0,680px)] justify-center",
      )}
    >
      {() => (
        <>
          <div
            className={cn(
              "flex flex-col gap-6",
              hasCustomAlign ? "" : alignmentMap[block.alignment],
              containerWidthMap[block.containerWidth],
              hasMedia ? "lg:mx-0" : "mx-auto",
            )}
          >
            {block.eyebrow ? (
              <span className="text-sm font-semibold tracking-wide uppercase text-primary">
                {block.eyebrow}
              </span>
            ) : null}

            <div className="space-y-4">
              <h1
                className={cn(
                  "text-4xl md:text-5xl font-bold leading-tight",
                  block.alignment === "center" ? "mx-auto" : undefined,
                )}
              >
                {block.heading}
                {block.highlight ? (
                  <span className="block bg-gradient-hero bg-clip-text text-transparent">
                    {block.highlight}
                  </span>
                ) : null}
              </h1>

              {block.description ? (
                <p
                  className={cn(
                    "text-lg md:text-xl text-muted-foreground",
                    block.alignment === "center"
                      ? "mx-auto max-w-3xl"
                      : "max-w-2xl",
                  )}
                >
                  {block.description}
                </p>
              ) : null}
            </div>

            {hasActions ? (
              <div
                className={cn(
                  "flex flex-wrap gap-3",
                  styleAlignValue === "center"
                    ? "justify-center"
                    : styleAlignValue === "end"
                      ? "justify-end"
                      : block.alignment === "center"
                        ? "justify-center"
                        : "justify-start",
                )}
              >
                {block.primaryAction ? (
                  <ActionLink action={block.primaryAction} />
                ) : null}
                {block.secondaryAction ? (
                  <ActionLink
                    action={block.secondaryAction}
                    variant={block.secondaryAction.variant ?? "secondary"}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {hasMedia ? (
            <div className="relative w-full">
              {block.media?.type === "video" ? (
                <div className="aspect-video overflow-hidden rounded-xl shadow-elegant">
                  <video
                    src={block.media.src}
                    className="h-full w-full object-cover"
                    controls
                    preload="none"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl shadow-elegant">
                  <Image
                    src={block.media?.src ?? ""}
                    alt={block.media?.alt ?? ""}
                    width={1200}
                    height={900}
                    className="w-full object-cover"
                    priority
                    unoptimized={Boolean(block.media?.src?.startsWith("http"))}
                  />
                  {block.media?.caption ? (
                    <span className="absolute bottom-3 left-3 text-sm text-white/80 drop-shadow-lg">
                      {block.media.caption}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </BlockSurface>
  );
}
