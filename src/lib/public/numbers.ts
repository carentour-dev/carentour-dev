import type { PublicLocale } from "@/i18n/routing";

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function getPublicNumberLocale(locale: PublicLocale) {
  return locale === "ar" ? "ar-EG" : "en-US";
}

export function localizeDigits(value: string, locale: PublicLocale) {
  if (locale !== "ar") {
    return value;
  }

  return value.replace(/\d/g, (digit) => {
    const localizedDigit = ARABIC_INDIC_DIGITS[Number(digit)];
    return localizedDigit ?? digit;
  });
}

export function localizeOptionalDigits(
  value: string | null | undefined,
  locale: PublicLocale,
) {
  if (typeof value !== "string") {
    return value;
  }

  return localizeDigits(value, locale);
}
