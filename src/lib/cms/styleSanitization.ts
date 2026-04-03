const STYLE_TAG_BREAKOUT_PATTERN = /<\/style/gi;

export function sanitizeStyleTagBreakout(value: string): string {
  return value.replace(STYLE_TAG_BREAKOUT_PATTERN, "<\\/style");
}
