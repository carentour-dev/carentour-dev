import type { NextRequest } from "next/server";
import type { PublicLocale } from "@/i18n/routing";

type SearchParamsLike = Pick<URLSearchParams, "get" | "toString">;

export function resolveAdminLocale(
  request: NextRequest | SearchParamsLike,
): PublicLocale {
  const searchParams =
    "nextUrl" in request ? request.nextUrl.searchParams : request;

  return searchParams.get("locale") === "ar" ? "ar" : "en";
}

export function buildAdminLocaleHref(
  pathname: string,
  locale: PublicLocale,
  searchParams?: SearchParamsLike | string | null,
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
