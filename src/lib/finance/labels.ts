const UPPERCASE_TOKENS = new Set([
  "ap",
  "ar",
  "api",
  "id",
  "cogs",
  "usd",
  "egp",
  "eur",
  "gbp",
  "sar",
  "aed",
]);

export const humanizeFinanceLabel = (value?: string | null) => {
  if (typeof value !== "string") {
    return "-";
  }

  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "-";
  }

  return normalized
    .split(" ")
    .map((token) => {
      const lower = token.toLowerCase();

      if (UPPERCASE_TOKENS.has(lower)) {
        return lower.toUpperCase();
      }

      if (/^\d+$/.test(lower)) {
        return lower;
      }

      return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
};
