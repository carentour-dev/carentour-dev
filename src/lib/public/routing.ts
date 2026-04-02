import {
  defaultPublicLocale,
  publicLocales,
  type PublicLocale,
} from "@/i18n/routing";
import { normalizePath } from "@/lib/seo/utils";

export const PUBLIC_ARABIC_UNSUPPORTED_PREFIXES = [
  "/doctors",
  "/stories",
  "/consultation",
  "/start-journey",
] as const;

export function isPublicLocale(value: string): value is PublicLocale {
  return publicLocales.includes(value as PublicLocale);
}

export function isPublicArabicEnabled() {
  return process.env.PUBLIC_ARABIC_ENABLED !== "false";
}

export function getPublicDirection(locale: PublicLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function stripPublicLocalePrefix(pathname: string) {
  const normalized = normalizePath(pathname);

  if (normalized === "/ar") {
    return "/";
  }

  if (normalized.startsWith("/ar/")) {
    return normalizePath(normalized.slice(3));
  }

  if (normalized === "/en") {
    return "/";
  }

  if (normalized.startsWith("/en/")) {
    return normalizePath(normalized.slice(3));
  }

  return normalized;
}

export function localizePublicPathname(
  pathname: string,
  locale: PublicLocale,
): string {
  const normalized = stripPublicLocalePrefix(pathname);

  if (locale === "ar") {
    return normalized === "/" ? "/ar" : `/ar${normalized}`;
  }

  return normalized;
}

export function isPublicPathStaticallySupported(
  pathname: string,
  locale: PublicLocale,
) {
  const normalized = stripPublicLocalePrefix(pathname);

  if (locale === defaultPublicLocale) {
    return true;
  }

  return !PUBLIC_ARABIC_UNSUPPORTED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function localizePublicPathnameWithFallback(
  pathname: string,
  locale: PublicLocale,
) {
  const normalized = stripPublicLocalePrefix(pathname);

  return isPublicPathStaticallySupported(normalized, locale)
    ? localizePublicPathname(normalized, locale)
    : normalized;
}
