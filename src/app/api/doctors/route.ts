import { NextRequest } from "next/server";
import { jsonResponse } from "@/server/utils/http";
import { fetchLocalizedPublicDoctors } from "@/server/modules/doctors/public";

const resolveLocale = (request: NextRequest) =>
  request.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";

export async function GET(req: NextRequest) {
  const treatmentCategory =
    req.nextUrl.searchParams.get("treatmentCategory")?.trim() || undefined;
  const doctors = await fetchLocalizedPublicDoctors({
    locale: resolveLocale(req),
    treatmentCategory,
  });

  return jsonResponse(doctors);
}
