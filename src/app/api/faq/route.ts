import { NextRequest, NextResponse } from "next/server";
import { defaultPublicLocale } from "@/i18n/routing";
import { getLocalizedFaqs } from "@/lib/public/localization";
import { isPublicLocale } from "@/lib/public/routing";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && isPublicLocale(localeParam)
      ? localeParam
      : defaultPublicLocale;
  const result = await getLocalizedFaqs(locale);

  return NextResponse.json({
    data: result.faqs,
    categories: result.categories,
    source: result.source,
    error: result.error,
  });
}
