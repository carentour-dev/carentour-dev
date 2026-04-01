import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

import { defaultPublicLocale } from "@/i18n/routing";
import { isPublicLocale } from "@/lib/public/routing";
import { loadPublicNavigationLinks } from "@/server/navigation";

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && isPublicLocale(localeParam)
      ? localeParam
      : defaultPublicLocale;
  const result = await loadPublicNavigationLinks(locale);

  return NextResponse.json(
    { links: result.links, error: result.error },
    { status: result.error ? 500 : 200 },
  );
}
