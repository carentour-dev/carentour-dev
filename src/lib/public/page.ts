import { notFound } from "next/navigation";
import { type PublicLocale } from "@/i18n/routing";
import { localizePublicPathname } from "@/lib/public/routing";
import {
  getPublicLocaleAvailability,
  validatePublicLocale,
} from "@/lib/public/localization";

export type PublicLocaleParams = Promise<{ locale: string }>;

export async function getPublicLocaleFromParams(
  params: PublicLocaleParams,
): Promise<PublicLocale> {
  const { locale } = await params;
  validatePublicLocale(locale);
  return locale;
}

export async function assertPublicPageAvailable(
  pathname: string,
  locale: PublicLocale,
) {
  if (!(await getPublicLocaleAvailability(pathname, locale))) {
    notFound();
  }
}

export function getLocalizedPublicPagePathname(
  pathname: string,
  locale: PublicLocale,
) {
  return localizePublicPathname(pathname, locale);
}
