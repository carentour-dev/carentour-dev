import type { PublicLocale } from "@/i18n/routing";

export const COMPANY_NAME_EN = "Care N Tour";
export const COMPANY_NAME_AR = "كير آند تور";

const COMPANY_NAME_EN_PATTERN = /Care N Tour/g;

export function getLocalizedCompanyName(locale: PublicLocale) {
  return locale === "ar" ? COMPANY_NAME_AR : COMPANY_NAME_EN;
}

export function localizeCompanyName<T extends string | null | undefined>(
  value: T,
  locale: PublicLocale,
): T {
  if (typeof value !== "string") {
    return value;
  }

  if (locale !== "ar") {
    return value;
  }

  return value.replace(COMPANY_NAME_EN_PATTERN, COMPANY_NAME_AR) as T;
}

export function localizeCompanyNameDeep<T>(value: T, locale: PublicLocale): T {
  if (typeof value === "string") {
    return localizeCompanyName(value, locale) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => localizeCompanyNameDeep(entry, locale)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        localizeCompanyNameDeep(entry, locale),
      ]),
    ) as T;
  }

  return value;
}
