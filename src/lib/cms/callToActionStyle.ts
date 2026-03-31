import type { BlockStyle } from "@/lib/cms/blocks";

type CallToActionBackground = "muted" | "accent" | "dark" | "image" | "none";
type CallToActionImage = {
  src?: string;
  alt?: string;
  overlay?: boolean;
};

export function buildCallToActionBackgroundStyle(
  background: CallToActionBackground,
  image?: CallToActionImage,
): NonNullable<BlockStyle["background"]> {
  switch (background) {
    case "muted":
      return {
        variant: "solid",
        color: {
          base: "hsl(var(--surface-subtle))",
        },
        overlayOpacity: {
          base: 0,
        },
      };
    case "accent":
      return {
        variant: "solid",
        color: {
          base: "hsl(var(--surface-brand-soft))",
        },
        overlayOpacity: {
          base: 0,
        },
      };
    case "dark":
      return {
        variant: "solid",
        color: {
          base: "hsl(var(--editorial-ink))",
        },
        overlayOpacity: {
          base: 0,
        },
      };
    case "image":
      return {
        variant: "image",
        image: image?.src
          ? {
              base: {
                src: image.src,
                alt: image.alt ?? "",
                fit: "cover",
              },
            }
          : undefined,
        overlayOpacity: {
          base: image?.overlay === false ? 0 : 0.6,
        },
      };
    case "none":
    default:
      return {
        variant: "none",
      };
  }
}

export function buildCallToActionBaseStyle(
  background: CallToActionBackground,
  image?: CallToActionImage,
): Partial<BlockStyle> {
  return {
    layout: {
      padding: {
        top: { base: "lg" },
        bottom: { base: "lg" },
      },
    },
    background: buildCallToActionBackgroundStyle(background, image),
  };
}
