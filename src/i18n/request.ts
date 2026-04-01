import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import {
  defaultPublicLocale,
  publicLocales,
  type PublicLocale,
} from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(publicLocales, requestedLocale)
    ? (requestedLocale as PublicLocale)
    : defaultPublicLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
