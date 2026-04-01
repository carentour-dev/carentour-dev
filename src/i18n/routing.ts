import { defineRouting } from "next-intl/routing";

export const publicLocales = ["en", "ar"] as const;

export type PublicLocale = (typeof publicLocales)[number];

export const defaultPublicLocale: PublicLocale = "en";

export const routing = defineRouting({
  locales: [...publicLocales],
  defaultLocale: defaultPublicLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});
