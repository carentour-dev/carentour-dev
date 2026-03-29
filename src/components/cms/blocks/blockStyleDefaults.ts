import type { BlockInstance, BlockStyle } from "@/lib/cms/blocks";

type BlockStyleDefaults = Partial<BlockStyle>;

function mergeResponsiveValues<T>(
  defaults?: Record<string, T | undefined>,
  overrides?: Record<string, T | undefined>,
) {
  if (!defaults && !overrides) return undefined;
  return { ...(defaults ?? {}), ...(overrides ?? {}) };
}

function mergeBlockStyles(
  defaults: BlockStyleDefaults,
  overrides?: BlockStyle,
): BlockStyle {
  return {
    ...defaults,
    ...overrides,
    layout: {
      ...defaults.layout,
      ...overrides?.layout,
      padding: {
        ...defaults.layout?.padding,
        ...overrides?.layout?.padding,
        top: mergeResponsiveValues(
          defaults.layout?.padding?.top,
          overrides?.layout?.padding?.top,
        ),
        bottom: mergeResponsiveValues(
          defaults.layout?.padding?.bottom,
          overrides?.layout?.padding?.bottom,
        ),
      },
      maxWidth: mergeResponsiveValues(
        defaults.layout?.maxWidth,
        overrides?.layout?.maxWidth,
      ),
      horizontalAlign: mergeResponsiveValues(
        defaults.layout?.horizontalAlign,
        overrides?.layout?.horizontalAlign,
      ),
    },
    background: {
      ...defaults.background,
      ...overrides?.background,
      color: mergeResponsiveValues(
        defaults.background?.color,
        overrides?.background?.color,
      ),
      gradient: {
        ...defaults.background?.gradient,
        ...overrides?.background?.gradient,
      },
      image: mergeResponsiveValues(
        defaults.background?.image,
        overrides?.background?.image,
      ),
      video: mergeResponsiveValues(
        defaults.background?.video,
        overrides?.background?.video,
      ),
      overlayOpacity: mergeResponsiveValues(
        defaults.background?.overlayOpacity,
        overrides?.background?.overlayOpacity,
      ),
    },
    typography: {
      ...defaults.typography,
      ...overrides?.typography,
      textColor: mergeResponsiveValues(
        defaults.typography?.textColor,
        overrides?.typography?.textColor,
      ),
      scale: mergeResponsiveValues(
        defaults.typography?.scale,
        overrides?.typography?.scale,
      ),
      weight: mergeResponsiveValues(
        defaults.typography?.weight,
        overrides?.typography?.weight,
      ),
      letterSpacing: mergeResponsiveValues(
        defaults.typography?.letterSpacing,
        overrides?.typography?.letterSpacing,
      ),
    },
    effects: {
      ...defaults.effects,
      ...overrides?.effects,
      animation: {
        ...defaults.effects?.animation,
        ...overrides?.effects?.animation,
      },
      parallax: {
        ...defaults.effects?.parallax,
        ...overrides?.effects?.parallax,
      },
    },
    visibility: {
      ...defaults.visibility,
      ...overrides?.visibility,
    },
  };
}

export function withBlockStyleDefaults<TBlock extends BlockInstance>(
  block: TBlock,
  defaults: BlockStyleDefaults,
): TBlock {
  return {
    ...block,
    style: mergeBlockStyles(defaults, block.style),
  };
}
