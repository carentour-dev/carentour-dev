import Link from "next/link";
import type { CSSProperties } from "react";
import type { PublicLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import type { BlockInstance, BlockStyle, BlockValue } from "@/lib/cms/blocks";
import { getLocalizedSafeManagedHref } from "@/lib/managedHrefs";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import {
  getFirstDefinedResponsiveValue,
  resolveLogicalTextAlign,
} from "./styleUtils";

const backgroundPresets: Record<
  Exclude<BlockValue<"callToAction">["background"], "none">,
  {
    section: string;
    text?: string;
    description?: string;
    secondaryButton?: string;
  }
> = {
  muted: {
    section: "bg-surface-subtle",
    text: "text-foreground",
    description: "text-muted-foreground",
  },
  accent: {
    section: "bg-surface-brand-soft",
    text: "text-primary",
    description: "text-primary/80",
  },
  dark: {
    section:
      "border-y border-[hsl(var(--editorial-ink-foreground)/0.08)] bg-[hsl(var(--editorial-ink))]",
    text: "text-[hsl(var(--editorial-ink-foreground))]",
    description: "text-[hsl(var(--editorial-ink-muted))]",
    secondaryButton:
      "border-[hsl(var(--editorial-ink-foreground)/0.4)] bg-transparent text-[hsl(var(--editorial-ink-foreground))] hover:bg-[hsl(var(--editorial-ink-foreground)/0.1)] hover:text-[hsl(var(--editorial-ink-foreground))]",
  },
  image: {
    section: "relative overflow-hidden",
    text: "text-white",
    description: "text-white/80",
  },
};

export function CallToActionBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"callToAction">;
  locale?: PublicLocale;
}) {
  const actions = block.actions ?? [];
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
  const styleBackgroundVariant = blockWithStyle.style?.background?.variant;
  const backgroundChoice =
    block.background === "none" ? undefined : block.background;
  const styleExplicitNone = styleBackgroundVariant === "none";
  const styleOverridesPreset =
    styleBackgroundVariant !== undefined &&
    styleBackgroundVariant !== "none" &&
    !(derivedBackground && styleBackgroundVariant === "image");
  const shouldApplyPreset =
    backgroundChoice && !styleExplicitNone && !styleOverridesPreset;
  const visualPreset = backgroundChoice
    ? backgroundPresets[backgroundChoice]
    : undefined;
  const appliedPreset = shouldApplyPreset ? visualPreset : undefined;
  const descriptionClass = visualPreset?.description ?? "text-muted-foreground";
  const styleAlignValue = getFirstDefinedResponsiveValue(
    blockWithStyle.style?.layout?.horizontalAlign,
  );
  const resolvedAlign =
    styleAlignValue ?? (block.layout === "centered" ? "center" : "start");
  const contentTextStyle: CSSProperties = {
    textAlign: resolveLogicalTextAlign(resolvedAlign),
  };
  const actionsAlignClass =
    resolvedAlign === "center"
      ? "justify-center"
      : resolvedAlign === "end"
        ? "justify-end"
        : block.layout === "centered"
          ? "justify-center"
          : "justify-start";

  return (
    <BlockSurface
      block={blockWithStyle}
      className={cn(appliedPreset?.section, visualPreset?.text)}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName={cn(
        "grid items-center gap-8",
        block.layout === "split"
          ? "lg:grid-cols-[2fr_1fr]"
          : "lg:max-w-4xl mx-auto",
        resolvedAlign === "center" && "justify-items-center",
      )}
    >
      {() => (
        <>
          <div className="space-y-4" style={contentTextStyle}>
            {block.eyebrow ? (
              <span className="text-sm font-semibold uppercase tracking-wide opacity-80">
                {block.eyebrow}
              </span>
            ) : null}
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
              {block.heading}
            </h2>
            {block.description ? (
              <p className={cn("text-lg md:max-w-3xl", descriptionClass)}>
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
                    visualPreset?.secondaryButton && index > 0
                      ? visualPreset.secondaryButton
                      : undefined,
                  )}
                >
                  <Link
                    href={getLocalizedSafeManagedHref(action.href, locale)}
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
