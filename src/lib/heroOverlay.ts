export type HeroOverlaySettings = {
  fromColor: string;
  fromOpacity: number;
  viaColor: string;
  viaOpacity: number;
  toColor: string;
  toOpacity: number;
};

export const DEFAULT_HERO_OVERLAY: HeroOverlaySettings = {
  fromColor: "#000000",
  fromOpacity: 0.7,
  viaColor: "#000000",
  viaOpacity: 0.45,
  toColor: "#000000",
  toOpacity: 0,
};

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (shortHex) {
    return shortHex[1]
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const longHex = /^#([0-9a-f]{6})$/i.exec(trimmed);
  return longHex ? longHex[1] : null;
}

function withOpacity(color: string, opacity: number) {
  const clampedOpacity = Math.min(Math.max(opacity, 0), 1);
  const normalizedHex = normalizeHexColor(color);

  if (normalizedHex) {
    const red = parseInt(normalizedHex.slice(0, 2), 16);
    const green = parseInt(normalizedHex.slice(2, 4), 16);
    const blue = parseInt(normalizedHex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clampedOpacity})`;
  }

  return `color-mix(in srgb, ${color} ${Math.round(clampedOpacity * 100)}%, transparent)`;
}

export function resolveHeroOverlay(
  overlay?: Partial<HeroOverlaySettings> | null,
): HeroOverlaySettings {
  return {
    ...DEFAULT_HERO_OVERLAY,
    ...overlay,
  };
}

export function buildHeroOverlayGradient(
  overlay?: Partial<HeroOverlaySettings> | null,
) {
  const resolved = resolveHeroOverlay(overlay);

  return `linear-gradient(90deg, ${withOpacity(resolved.fromColor, resolved.fromOpacity)} 0%, ${withOpacity(resolved.viaColor, resolved.viaOpacity)} 60%, ${withOpacity(resolved.toColor, resolved.toOpacity)} 100%)`;
}
