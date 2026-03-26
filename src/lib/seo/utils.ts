import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  OG_FALLBACK_ENDPOINT,
} from "@/lib/seo/constants";
import type { JsonLdNode, SeoLocale } from "@/lib/seo/types";

export function normalizePath(pathname: string): string {
  const raw = (pathname || "").trim();
  if (!raw) return "/";

  let path = raw.split("?")[0].split("#")[0] || "/";
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path || "/";
}

export function toCanonicalUrl(pathOrUrl: string): string {
  if (!pathOrUrl) {
    return CANONICAL_ORIGIN;
  }

  try {
    const parsed = new URL(pathOrUrl);
    const canonical = new URL(CANONICAL_ORIGIN);
    canonical.pathname = normalizePath(parsed.pathname || "/");
    canonical.search = "";
    canonical.hash = "";
    return canonical.toString();
  } catch {
    const canonical = new URL(CANONICAL_ORIGIN);
    canonical.pathname = normalizePath(pathOrUrl);
    canonical.search = "";
    canonical.hash = "";
    return canonical.toString();
  }
}

export function toAbsoluteUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    return DEFAULT_OG_IMAGE;
  }

  try {
    const parsed = new URL(pathOrUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return DEFAULT_OG_IMAGE;
  } catch {
    const normalized = normalizePath(pathOrUrl);
    return `${CANONICAL_ORIGIN}${normalized}`;
  }
}

export function parseKeywords(
  value: string | string[] | null | undefined,
): string[] | undefined {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    const list = value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
    return list.length > 0 ? list : undefined;
  }

  const list = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return list.length > 0 ? list : undefined;
}

export function buildOgFallbackImageUrl(
  pathname: string,
  title: string,
): string {
  const params = new URLSearchParams({
    path: normalizePath(pathname),
    title,
  });

  return `${CANONICAL_ORIGIN}${OG_FALLBACK_ENDPOINT}?${params.toString()}`;
}

export function asJsonLdArray(
  payload: JsonLdNode | JsonLdNode[] | null | undefined,
): JsonLdNode[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter(isJsonLdObject);
  }
  return isJsonLdObject(payload) ? [payload] : [];
}

export function isJsonLdObject(value: unknown): value is JsonLdNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const typed = value as Record<string, unknown>;
  return Boolean(typed["@type"] || typed["@context"]);
}

export function buildLocaleAlternates(pathname: string, _locale: SeoLocale) {
  const normalizedPath = normalizePath(pathname);
  const englishPath = normalizedPath.startsWith("/ar/")
    ? normalizePath(normalizedPath.slice(3))
    : normalizedPath === "/ar"
      ? "/"
      : normalizedPath;

  const englishUrl = `${CANONICAL_ORIGIN}${englishPath}`;

  const languages: Record<string, string> = {
    en: englishUrl,
    "x-default": englishUrl,
    ar: `${CANONICAL_ORIGIN}${englishPath === "/" ? "/ar" : `/ar${englishPath}`}`,
  };

  return languages;
}

export function isInternalNoindexPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return /^\/(?:ar\/)?(?:admin|auth|cms|dashboard|finance|operations|staff|api)(?:\/|$)/.test(
    path,
  );
}
