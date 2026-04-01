import { NextRequest, NextResponse } from "next/server";
import { resolvePublicLocaleSwitchHref } from "@/lib/public/localization";
import { isPublicLocale } from "@/lib/public/routing";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname") ?? "/";
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!isPublicLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const href = await resolvePublicLocaleSwitchHref(pathname, locale);
  return NextResponse.json({ href });
}
