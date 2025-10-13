import type { CSSProperties } from "react";
import type {
  BlockAdvancedSettings,
  BlockInstance,
  BlockMedia,
  BlockStyle,
  BreakpointKey,
  ResponsiveValue,
  BlockVideo,
} from "@/lib/cms/blocks";
import { blockBreakpoints } from "@/lib/cms/blocks";

type SpacingToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

const spacingValueMap: Record<SpacingToken & string, string> = {
  none: "0rem",
  xs: "1rem",
  sm: "2rem",
  md: "3rem",
  lg: "4rem",
  xl: "5rem",
  "2xl": "6rem",
  "3xl": "8rem",
};

const letterSpacingValueMap: Record<string, string> = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.08em",
};

const fontWeightValueMap: Record<string, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const typographyScaleMap: Record<
  string,
  { base: string; h1: string; h2: string; h3: string }
> = {
  xs: { base: "0.95rem", h1: "2.25rem", h2: "1.75rem", h3: "1.4rem" },
  sm: { base: "1rem", h1: "2.5rem", h2: "1.9rem", h3: "1.5rem" },
  base: { base: "1.05rem", h1: "2.75rem", h2: "2rem", h3: "1.6rem" },
  lg: { base: "1.125rem", h1: "3rem", h2: "2.25rem", h3: "1.75rem" },
  xl: { base: "1.2rem", h1: "3.25rem", h2: "2.5rem", h3: "1.9rem" },
  "2xl": { base: "1.3rem", h1: "3.5rem", h2: "2.75rem", h3: "2.2rem" },
  "3xl": { base: "1.4rem", h1: "3.75rem", h2: "3rem", h3: "2.4rem" },
  "4xl": { base: "1.5rem", h1: "4rem", h2: "3.25rem", h3: "2.6rem" },
};

const maxWidthValueMap: Record<string, string> = {
  content: "60rem",
  wide: "72rem",
  full: "100%",
};

const breakpointMediaQuery: Record<Exclude<BreakpointKey, "base">, string> = {
  mobile: "@media (min-width: 640px)",
  tablet: "@media (min-width: 768px)",
  desktop: "@media (min-width: 1024px)",
};

function spacingTokenToRem(
  token: SpacingToken | undefined,
  fallback: string,
): string {
  if (!token) return fallback;
  return spacingValueMap[token] ?? fallback;
}

function responsiveValueForBreakpoint<T>(
  value: ResponsiveValue<T> | undefined,
  breakpoint: BreakpointKey,
): T | undefined {
  return value ? value[breakpoint] : undefined;
}

export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function resolveBlockDomId(
  block: BlockInstance,
  advanced?: BlockAdvancedSettings,
): string {
  if (advanced?.anchorId) {
    return advanced.anchorId;
  }
  if (block.blockId) {
    return `block-${block.blockId}`;
  }
  return `${block.type}-${hashString(JSON.stringify(block).slice(0, 32))}`;
}

export function hasResponsiveValue<T>(value?: ResponsiveValue<T>): boolean {
  if (!value) return false;
  return blockBreakpoints.some((bp) => value[bp] !== undefined);
}

export function getFirstDefinedResponsiveValue<T>(
  value?: ResponsiveValue<T>,
): T | undefined {
  if (!value) return undefined;
  for (const bp of blockBreakpoints) {
    const candidate = value[bp];
    if (candidate !== undefined) {
      return candidate;
    }
  }
  return undefined;
}

export function buildSpacingCss(
  domId: string,
  padding: BlockStyle["layout"] extends { padding?: infer P } ? P : never,
  defaults: { top: string; bottom: string },
): string {
  if (!domId) return "";
  const top = padding?.top;
  const bottom = padding?.bottom;

  const baseTop = spacingTokenToRem(
    responsiveValueForBreakpoint(top, "base"),
    defaults.top,
  );
  const baseBottom = spacingTokenToRem(
    responsiveValueForBreakpoint(bottom, "base"),
    defaults.bottom,
  );

  const css: string[] = [
    `#${domId}{padding-top:${baseTop};padding-bottom:${baseBottom};}`,
  ];

  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const topValue = responsiveValueForBreakpoint(top, bp);
    const bottomValue = responsiveValueForBreakpoint(bottom, bp);
    if (!topValue && !bottomValue) return;
    const resolvedTop = spacingTokenToRem(topValue, baseTop);
    const resolvedBottom = spacingTokenToRem(bottomValue, baseBottom);
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId}{padding-top:${resolvedTop};padding-bottom:${resolvedBottom};}}`,
    );
  });

  return css.join("\n");
}

export function buildInnerLayoutCss(
  domId: string,
  layout: BlockStyle["layout"] | undefined,
  { selector = ".cms-block__inner" }: { selector?: string } = {},
): string {
  if (!domId || !layout) return "";

  const css: string[] = [];
  const maxWidth = layout.maxWidth;
  const align = layout.horizontalAlign;

  if (maxWidth) {
    const base = maxWidth.base
      ? (maxWidthValueMap[maxWidth.base] ?? maxWidth.base)
      : undefined;
    if (base) {
      css.push(`#${domId} ${selector}{max-width:${base};}`);
    }
    (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
      const value = maxWidth[bp];
      if (!value) return;
      const candidate = maxWidthValueMap[value] ?? value;
      css.push(
        `${breakpointMediaQuery[bp]}{#${domId} ${selector}{max-width:${candidate};}}`,
      );
    });
  }

  if (align) {
    const alignmentStyles: Record<
      string,
      { margin: string; textAlign: string }
    > = {
      start: { margin: "0 auto 0 0", textAlign: "left" },
      center: { margin: "0 auto", textAlign: "center" },
      end: { margin: "0 0 0 auto", textAlign: "right" },
    };
    const baseAlign = align.base ? alignmentStyles[align.base] : undefined;
    if (baseAlign) {
      css.push(
        `#${domId} ${selector}{margin:${baseAlign.margin};text-align:${baseAlign.textAlign};}`,
      );
    }
    (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
      const value = align[bp];
      if (!value) return;
      const config = alignmentStyles[value];
      css.push(
        `${breakpointMediaQuery[bp]}{#${domId} ${selector}{margin:${config.margin};text-align:${config.textAlign};}}`,
      );
    });
  }

  return css.join("\n");
}

export function buildTypographyCss(
  domId: string,
  typography: BlockStyle["typography"] | undefined,
): string {
  if (!domId || !typography) return "";
  const css: string[] = [];

  const scale = typography.scale;
  const weight = typography.weight;
  const letterSpacing = typography.letterSpacing;
  const textColor = typography.textColor;
  const headingAccentColor = typography.headingAccentColor;

  if (scale?.base) {
    const values = typographyScaleMap[scale.base];
    if (values) {
      css.push(
        `#${domId}{font-size:${values.base};}\n#${domId} h1{font-size:${values.h1};}\n#${domId} h2{font-size:${values.h2};}\n#${domId} h3{font-size:${values.h3};}`,
      );
    }
  }

  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const value = scale?.[bp];
    if (!value) return;
    const values = typographyScaleMap[value];
    if (!values) return;
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId}{font-size:${values.base};}#${domId} h1{font-size:${values.h1};}#${domId} h2{font-size:${values.h2};}#${domId} h3{font-size:${values.h3};}}`,
    );
  });

  if (weight?.base) {
    const fontWeight = fontWeightValueMap[weight.base] ?? 400;
    css.push(`#${domId}{font-weight:${fontWeight};}`);
  }
  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const value = weight?.[bp];
    if (!value) return;
    const fontWeight = fontWeightValueMap[value] ?? 400;
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId}{font-weight:${fontWeight};}}`,
    );
  });

  if (letterSpacing?.base) {
    const spacing = letterSpacingValueMap[letterSpacing.base] ?? "0";
    css.push(`#${domId}{letter-spacing:${spacing};}`);
  }
  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const value = letterSpacing?.[bp];
    if (!value) return;
    const spacing = letterSpacingValueMap[value] ?? "0";
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId}{letter-spacing:${spacing};}}`,
    );
  });

  if (headingAccentColor) {
    css.push(
      `#${domId} h1,#${domId} h2,#${domId} h3{color:${headingAccentColor} !important;}\n#${domId} p,#${domId} li,#${domId} blockquote{color:inherit;}`,
    );
  }

  if (textColor?.base) {
    css.push(
      `#${domId},#${domId} .cms-block__inner{color:${textColor.base} !important;}` +
        `#${domId} .cms-block__inner p,#${domId} .cms-block__inner li,#${domId} .cms-block__inner blockquote,#${domId} .cms-block__inner strong,#${domId} .cms-block__inner em,#${domId} .cms-block__inner span{color:${textColor.base} !important;}`,
    );
  }

  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const value = textColor?.[bp];
    if (!value) return;
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId},#${domId} .cms-block__inner{color:${value} !important;}#${domId} .cms-block__inner p,#${domId} .cms-block__inner li,#${domId} .cms-block__inner blockquote,#${domId} .cms-block__inner strong,#${domId} .cms-block__inner em,#${domId} .cms-block__inner span{color:${value} !important;}}`,
    );
  });

  return css.join("\n");
}

type BackgroundConfig = BlockStyle["background"];

function resolveMediaForBreakpoint(
  value: ResponsiveValue<BlockMedia> | undefined,
  breakpoint: BreakpointKey,
): BlockMedia | undefined {
  if (!value) return undefined;
  return value[breakpoint] ?? value.base;
}

function resolveVideoForBreakpoint(
  value: ResponsiveValue<BlockVideo> | undefined,
  breakpoint: BreakpointKey,
): BlockVideo | undefined {
  if (!value) return undefined;
  return value[breakpoint] ?? value.base;
}

function buildGradientCss(
  gradient: NonNullable<BackgroundConfig>["gradient"],
): string | undefined {
  if (!gradient) return undefined;
  if (gradient.css) return gradient.css;
  const { from, via, to, angle = 180, stops } = gradient;
  if (stops?.length) {
    const parts = stops.map((stop) => `${stop.color} ${stop.position}%`);
    return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
  }
  if (from && to && via) {
    return `linear-gradient(${angle}deg, ${from}, ${via}, ${to})`;
  }
  if (from && to) {
    return `linear-gradient(${angle}deg, ${from}, ${to})`;
  }
  return undefined;
}

export function buildBackgroundStyles(
  domId: string,
  background: BackgroundConfig | undefined,
): {
  inlineStyle: CSSProperties;
  cssText: string;
  overlayOpacity: {
    base: number | undefined;
    mobile?: number;
    tablet?: number;
    desktop?: number;
  } | null;
  backgroundVideo?: BlockVideo;
} {
  const inlineStyle: React.CSSProperties = {};
  const cssParts: string[] = [];
  let backgroundVideo: BlockVideo | undefined;

  if (!background) {
    return { inlineStyle, cssText: "", overlayOpacity: null };
  }

  const variant = background.variant ?? "none";
  const overlay = background.overlayOpacity;

  const setBaseBackgroundColor = (value?: string) => {
    if (value) {
      inlineStyle.backgroundColor = value;
    }
  };

  const setBaseBackgroundImage = (value?: string) => {
    if (value) {
      inlineStyle.backgroundImage = value.startsWith("url(")
        ? value
        : `url(${value})`;
      inlineStyle.backgroundSize = inlineStyle.backgroundSize ?? "cover";
      inlineStyle.backgroundRepeat = "no-repeat";
      inlineStyle.backgroundPosition =
        inlineStyle.backgroundPosition ?? "center";
    }
  };

  switch (variant) {
    case "solid": {
      setBaseBackgroundColor(
        background.color?.base ??
          background.color?.mobile ??
          background.color?.tablet ??
          background.color?.desktop,
      );
      (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
        const value = background.color?.[bp];
        if (!value) return;
        cssParts.push(
          `${breakpointMediaQuery[bp]}{#${domId}{background-color:${value};}}`,
        );
      });
      break;
    }
    case "gradient": {
      const baseGradient = buildGradientCss(background.gradient);
      if (baseGradient) {
        inlineStyle.backgroundImage = baseGradient;
      }
      break;
    }
    case "image": {
      const baseMedia =
        resolveMediaForBreakpoint(background.image, "base") ??
        resolveMediaForBreakpoint(background.image, "mobile") ??
        resolveMediaForBreakpoint(background.image, "tablet") ??
        resolveMediaForBreakpoint(background.image, "desktop");
      if (baseMedia?.src) {
        setBaseBackgroundImage(baseMedia.src);
        const { focalPoint, fit } = baseMedia;
        if (focalPoint) {
          inlineStyle.backgroundPosition = `${focalPoint.x}% ${focalPoint.y}%`;
        }
        if (fit) {
          inlineStyle.backgroundSize = fit === "contain" ? "contain" : "cover";
        }
      }
      (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
        const media = background.image?.[bp];
        if (!media?.src) return;
        const position = media.focalPoint
          ? `${media.focalPoint.x}% ${media.focalPoint.y}%`
          : undefined;
        const size = media.fit === "contain" ? "contain" : "cover";
        cssParts.push(
          `${breakpointMediaQuery[bp]}{#${domId}{background-image:url(${media.src});background-position:${position ?? "center"};background-size:${size};}}`,
        );
      });
      break;
    }
    case "video": {
      const baseVideo =
        resolveVideoForBreakpoint(background.video, "base") ??
        resolveVideoForBreakpoint(background.video, "mobile") ??
        resolveVideoForBreakpoint(background.video, "tablet") ??
        resolveVideoForBreakpoint(background.video, "desktop");
      if (baseVideo) {
        backgroundVideo = baseVideo;
      }
      break;
    }
    default:
      break;
  }

  const overlayValues = overlay
    ? {
        base: overlay.base,
        mobile: overlay.mobile,
        tablet: overlay.tablet,
        desktop: overlay.desktop,
      }
    : null;

  return {
    inlineStyle,
    cssText: cssParts.join("\n"),
    overlayOpacity: overlayValues,
    backgroundVideo,
  };
}

export function buildOverlayCss(
  domId: string,
  overlay: NonNullable<
    ReturnType<typeof buildBackgroundStyles>["overlayOpacity"]
  >,
): string {
  const css: string[] = [];
  const baseOpacity = overlay.base ?? 0;
  css.push(`#${domId} .cms-block__overlay{opacity:${baseOpacity};}`);
  (["mobile", "tablet", "desktop"] as const).forEach((bp) => {
    const value = overlay[bp];
    if (value === undefined) return;
    css.push(
      `${breakpointMediaQuery[bp]}{#${domId} .cms-block__overlay{opacity:${value};}}`,
    );
  });
  return css.join("\n");
}

export function buildVisibilityClasses(
  style: BlockStyle | undefined,
): string[] {
  if (!style?.visibility) return [];
  const classes = new Set<string>();
  const { hideOn, showOnlyOn } = style.visibility;

  if (showOnlyOn?.length) {
    classes.add("hidden");
    if (showOnlyOn.includes("mobile")) {
      classes.add("block");
    }
    if (showOnlyOn.includes("tablet")) {
      classes.add("md:block");
    }
    if (showOnlyOn.includes("desktop")) {
      classes.add("lg:block");
    }
    if (!showOnlyOn.includes("mobile")) {
      classes.add("sm:hidden");
    }
    if (!showOnlyOn.includes("tablet")) {
      classes.add("md:hidden");
    }
    if (!showOnlyOn.includes("desktop")) {
      classes.add("lg:hidden");
    }
    return Array.from(classes);
  }

  hideOn?.forEach((target) => {
    switch (target) {
      case "mobile":
        classes.add("hidden");
        classes.add("sm:block");
        break;
      case "tablet":
        classes.add("md:hidden");
        classes.add("lg:block");
        break;
      case "desktop":
        classes.add("lg:hidden");
        break;
      default:
        break;
    }
  });

  return Array.from(classes);
}

export function buildAdvancedClassNames(
  advanced: BlockAdvancedSettings | undefined,
): string | undefined {
  return advanced?.customClassName?.trim() || undefined;
}

export function selectCta(advanced: BlockAdvancedSettings | undefined) {
  return advanced?.cta;
}

export function blockHasPresetLock(
  advanced: BlockAdvancedSettings | undefined,
): boolean {
  return Boolean(advanced?.presetLock);
}
