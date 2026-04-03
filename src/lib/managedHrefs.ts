const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export const SAFE_MANAGED_HREF_MESSAGE =
  "Use an internal path, #anchor, or a full http(s), mailto, or tel link";

export function normalizeManagedHref(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function isSafeManagedHref(value: string | null | undefined) {
  const normalized = normalizeManagedHref(value);
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("/")) {
    return !normalized.startsWith("//");
  }

  if (normalized.startsWith("#") || normalized.startsWith("?")) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    return SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function getSafeManagedHref(
  value: string | null | undefined,
  fallback = "#",
) {
  const normalized = normalizeManagedHref(value);
  return isSafeManagedHref(normalized) ? normalized : fallback;
}
