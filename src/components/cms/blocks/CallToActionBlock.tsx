import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockInstance, BlockStyle, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";

const backgroundClasses: Record<
  BlockValue<"callToAction">["background"],
  string
> = {
  muted: "bg-muted/40 text-foreground",
  accent: "bg-primary/10 text-primary",
  dark: "bg-slate-900 text-slate-50",
  image: "relative overflow-hidden text-white",
};

export function CallToActionBlock({
  block,
}: {
  block: BlockInstance<"callToAction">;
}) {
  const actions = block.actions ?? [];
  const descriptionClass =
    block.background === "dark" || block.background === "image"
      ? "text-white/80"
      : "text-muted-foreground";
  const derivedBackground =
    !block.style?.background && block.background === "image" && block.image?.src
      ? ({
          variant: "image",
          image: {
            base: {
              src: block.image.src,
              alt: block.image.alt ?? "",
              fit: "cover",
            },
          },
          overlayOpacity: block.image.overlay ? { base: 0.6 } : undefined,
        } satisfies NonNullable<BlockStyle["background"]>)
      : undefined;

  const blockWithStyle: BlockInstance<"callToAction"> = derivedBackground
    ? {
        ...block,
        style: {
          ...(block.style ?? {}),
          background: derivedBackground,
        },
      }
    : block;
  const customBackgroundVariant = blockWithStyle.style?.background?.variant;
  const useDefaultBackgroundClass =
    !customBackgroundVariant || customBackgroundVariant === "none";
  const styleAlignValue = getFirstDefinedResponsiveValue(
    blockWithStyle.style?.layout?.horizontalAlign,
  );
  const textAlignClass =
    styleAlignValue === "center"
      ? "text-center"
      : styleAlignValue === "end"
        ? "text-right"
        : "text-left";
  const actionsAlignClass =
    styleAlignValue === "center"
      ? "justify-center"
      : styleAlignValue === "end"
        ? "justify-end"
        : block.layout === "centered"
          ? "justify-center"
          : "justify-start";

  return (
    <BlockSurface
      block={blockWithStyle}
      className={cn(
        useDefaultBackgroundClass
          ? backgroundClasses[block.background]
          : undefined,
        block.background === "image" && useDefaultBackgroundClass
          ? "text-white"
          : undefined,
      )}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName={cn(
        "grid items-center gap-8",
        block.layout === "split"
          ? "lg:grid-cols-[2fr_1fr]"
          : "lg:max-w-4xl mx-auto",
        block.layout === "centered" && !styleAlignValue
          ? "text-center justify-items-center"
          : textAlignClass,
      )}
    >
      {() => (
        <>
          <div className="space-y-4">
            {block.eyebrow ? (
              <span className="text-sm font-semibold uppercase tracking-wide opacity-80">
                {block.eyebrow}
              </span>
            ) : null}
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
              {block.heading}
            </h2>
            {block.description ? (
              <p
                className={cn(
                  "text-lg md:max-w-3xl",
                  descriptionClass,
                  textAlignClass,
                )}
              >
                {block.description}
              </p>
            ) : null}
          </div>
          {actions.length ? (
            <div className={cn("flex flex-wrap gap-3", actionsAlignClass)}>
              {actions.map((action, index) => (
                <Button
                  key={`cta-action-${index}`}
                  asChild
                  variant={
                    action.variant ?? (index === 0 ? "default" : "secondary")
                  }
                  size="lg"
                  className={cn(
                    block.background === "dark" && index > 0
                      ? "border border-white/40 bg-transparent"
                      : undefined,
                  )}
                >
                  <Link
                    href={action.href}
                    target={action.target ?? "_self"}
                    rel={
                      action.target === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </BlockSurface>
  );
}
