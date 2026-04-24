import type { CSSProperties, ReactNode } from "react";
import Image from "@/components/OptimizedImage";
import type {
  BlockInstance,
  BlockMedia,
  BreakpointKey,
  ResponsiveValue,
} from "@/lib/cms/blocks";
import { sanitizeStyleTagBreakout } from "@/lib/cms/styleSanitization";
import { cn } from "@/lib/utils";
import {
  buildAdvancedClassNames,
  buildBackgroundStyles,
  buildInnerLayoutCss,
  buildOverlayCss,
  buildSpacingCss,
  buildTypographyCss,
  buildVisibilityClasses,
  getFirstDefinedResponsiveValue,
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
    backgroundImage,
  } = buildBackgroundStyles(domId, block.style?.background);
  const backgroundImageCss = buildBackgroundImageCss(domId, backgroundImage);
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
    backgroundImageCss,
    overlayCss,
  ]
    .filter(Boolean)
    .join("\n");
  const safeCollectedCss = collectedCss
    ? sanitizeStyleTagBreakout(collectedCss)
    : "";

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
      {safeCollectedCss ? (
        <style dangerouslySetInnerHTML={{ __html: safeCollectedCss }} />
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
      <BackgroundImageLayer images={backgroundImage} />
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

const backgroundBreakpoints: Exclude<BreakpointKey, "base">[] = [
  "mobile",
  "tablet",
  "desktop",
  "full",
];

const backgroundMediaQueries: Record<Exclude<BreakpointKey, "base">, string> = {
  mobile: "@media (min-width: 640px)",
  tablet: "@media (min-width: 768px)",
  desktop: "@media (min-width: 1024px)",
  full: "@media (min-width: 1400px)",
};

function getBackgroundImageEntries(
  images: ResponsiveValue<BlockMedia> | undefined,
) {
  if (!images) {
    return [];
  }

  const fallback = getFirstDefinedResponsiveValue(images);
  const entries: Array<{ breakpoint: BreakpointKey; media: BlockMedia }> = [];

  if (fallback?.src) {
    entries.push({ breakpoint: "base", media: fallback });
  }

  backgroundBreakpoints.forEach((breakpoint) => {
    const media = images[breakpoint];
    if (media?.src) {
      entries.push({ breakpoint, media });
    }
  });

  return entries;
}

function resolveEffectiveBackgroundBreakpoint(
  images: ResponsiveValue<BlockMedia> | undefined,
  breakpoint: BreakpointKey,
) {
  if (!images) {
    return null;
  }

  let effective: BreakpointKey | null = getFirstDefinedResponsiveValue(images)
    ? "base"
    : null;

  for (const candidate of backgroundBreakpoints) {
    if (images[candidate]?.src) {
      effective = candidate;
    }

    if (candidate === breakpoint) {
      return effective;
    }
  }

  return effective;
}

function buildBackgroundImageCss(
  domId: string,
  images: ResponsiveValue<BlockMedia> | undefined,
) {
  const entries = getBackgroundImageEntries(images);
  if (entries.length === 0) {
    return "";
  }

  const css = [
    `#${domId} .cms-block__background-image{display:none;}`,
    `#${domId} .cms-block__background-image--base{display:block;}`,
  ];

  backgroundBreakpoints.forEach((breakpoint) => {
    const effective = resolveEffectiveBackgroundBreakpoint(images, breakpoint);
    if (!effective) {
      return;
    }

    css.push(
      `${backgroundMediaQueries[breakpoint]}{#${domId} .cms-block__background-image{display:none;}#${domId} .cms-block__background-image--${effective}{display:block;}}`,
    );
  });

  return css.join("\n");
}

function BackgroundImageLayer({
  images,
}: {
  images: ResponsiveValue<BlockMedia> | undefined;
}) {
  const entries = getBackgroundImageEntries(images);
  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      {entries.map(({ breakpoint, media }) => (
        <Image
          key={`${breakpoint}-${media.src}`}
          src={media.src}
          alt=""
          fill
          sizes="100vw"
          className={cn(
            "cms-block__background-image pointer-events-none absolute inset-0",
            `cms-block__background-image--${breakpoint}`,
            media.fit === "contain" ? "object-contain" : "object-cover",
          )}
          style={{
            objectPosition: media.focalPoint
              ? `${media.focalPoint.x}% ${media.focalPoint.y}%`
              : "center",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
