import type { NextRequest } from "next/server";
import type { PublicLocale } from "@/i18n/routing";

export function resolveAdminLocale(
  request: NextRequest | URLSearchParams,
): PublicLocale {
  const searchParams =
    request instanceof URLSearchParams ? request : request.nextUrl.searchParams;

  return searchParams.get("locale") === "ar" ? "ar" : "en";
}

export function buildAdminLocaleHref(
  pathname: string,
  locale: PublicLocale,
  searchParams?: URLSearchParams | string | null,
) {
  const [basePath, existingQuery = ""] = pathname.split("?");
  const params = new URLSearchParams(existingQuery);
  const extraParams =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : searchParams
        ? new URLSearchParams(searchParams.toString())
        : null;

  if (extraParams) {
    extraParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  if (locale === "ar") {
    params.set("locale", "ar");
  } else {
    params.delete("locale");
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
