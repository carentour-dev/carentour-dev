import type { CSSProperties, ReactNode } from "react";
import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import {
  buildAdvancedClassNames,
  buildBackgroundStyles,
  buildInnerLayoutCss,
  buildOverlayCss,
  buildSpacingCss,
  buildTypographyCss,
  buildVisibilityClasses,
  resolveBlockDomId,
} from "./styleUtils";

interface BlockSurfaceProps<TBlock extends BlockInstance> {
  block: TBlock;
  defaultPadding?: { top: string; bottom: string };
  className?: string;
  style?: CSSProperties;
  container?: boolean;
  containerClassName?: string;
  innerSelector?: string;
  contentClassName?: string;
  contentIdSuffix?: string;
  typographyTarget?: string;
  children: (context: { contentId: string; domId: string }) => ReactNode;
}

export function BlockSurface<TBlock extends BlockInstance>({
  block,
  defaultPadding = { top: "4rem", bottom: "4rem" },
  className,
  style,
  container = true,
  containerClassName,
  innerSelector = ".cms-block__inner",
  contentClassName,
  contentIdSuffix = "__content",
  typographyTarget,
  children,
}: BlockSurfaceProps<TBlock>) {
  const domId = resolveBlockDomId(block, block.advanced);
  const contentId = typographyTarget ?? `${domId}${contentIdSuffix}`;

  const spacingCss = buildSpacingCss(
    domId,
    block.style?.layout?.padding,
    defaultPadding,
  );
  const innerLayoutCss = buildInnerLayoutCss(domId, block.style?.layout, {
    selector: innerSelector,
  });
  const typographyCss = buildTypographyCss(contentId, block.style?.typography);
  const {
    inlineStyle: backgroundStyle,
    cssText: backgroundCss,
    overlayOpacity,
    backgroundVideo,
  } = buildBackgroundStyles(domId, block.style?.background);
  const overlayCss = overlayOpacity
    ? buildOverlayCss(domId, overlayOpacity)
    : "";
  const visibilityClasses = buildVisibilityClasses(block.style);
  const advancedClass = buildAdvancedClassNames(block.advanced);

  const collectedCss = [
    spacingCss,
    innerLayoutCss,
    typographyCss,
    backgroundCss,
    overlayCss,
  ]
    .filter(Boolean)
    .join("\n");

  const animation = block.style?.effects?.animation;
  const shouldAnimate = animation && (animation.type ?? "none") !== "none";
  const animationAttributes = shouldAnimate
    ? {
        "data-animate": animation?.type ?? "none",
        "data-animate-trigger": animation?.trigger ?? "load",
        "data-animate-delay": animation?.delayMs ?? 0,
        "data-animate-duration": animation?.durationMs ?? 500,
        "data-animate-once": animation?.once ?? true,
        "data-animate-state": "hidden",
      }
    : {};

  const containerClasses = cn(
    container ? "container mx-auto px-4" : undefined,
    "cms-block__inner",
    containerClassName,
  );

  const mergedStyle = style
    ? { ...backgroundStyle, ...style }
    : backgroundStyle;

  return (
    <section
      id={domId}
      data-cms-block=""
      className={cn(
        "relative overflow-hidden bg-background",
        visibilityClasses,
        advancedClass,
        className,
      )}
      style={mergedStyle}
      {...animationAttributes}
    >
      {collectedCss ? (
        <style dangerouslySetInnerHTML={{ __html: collectedCss }} />
      ) : null}
      {backgroundVideo?.src ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={backgroundVideo.src}
          autoPlay={backgroundVideo.autoplay ?? true}
          loop={backgroundVideo.loop ?? true}
          muted={backgroundVideo.muted ?? true}
          playsInline
          poster={backgroundVideo.poster}
        />
      ) : null}
      {overlayOpacity ? (
        <div className="cms-block__overlay absolute inset-0 bg-black pointer-events-none" />
      ) : null}
      <div className={containerClasses}>
        <div id={contentId} className={cn("relative z-10", contentClassName)}>
          {children({ contentId, domId })}
        </div>
      </div>
    </section>
  );
}
