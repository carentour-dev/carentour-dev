import type { NextRequest } from "next/server";
import { defaultPublicLocale, type PublicLocale } from "@/i18n/routing";
import { isPublicLocale } from "@/lib/public/routing";

export function resolvePublicLocaleFromRequest(
  request: NextRequest,
): PublicLocale {
  const localeParam = request.nextUrl.searchParams.get("locale");
  if (localeParam && isPublicLocale(localeParam)) {
    return localeParam;
  }

  const intlHeader = request.headers.get("x-next-intl-locale");
  if (intlHeader && isPublicLocale(intlHeader)) {
    return intlHeader;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const pathname = new URL(referer).pathname;
      if (pathname === "/ar" || pathname.startsWith("/ar/")) {
        return "ar";
      }
      if (pathname === "/en" || pathname.startsWith("/en/")) {
        return "en";
      }
    } catch {
      // Ignore malformed referrers and fall back to the default locale.
    }
  }

  return defaultPublicLocale;
}
