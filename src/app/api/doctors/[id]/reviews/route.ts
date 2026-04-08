import { NextRequest } from "next/server";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { fetchLocalizedDoctorReviews } from "@/server/modules/doctors/public";

const resolveLocale = (request: NextRequest) =>
  request.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const doctorId = getRouteParam(await ctx.params, "id");
  const reviews = await fetchLocalizedDoctorReviews(
    doctorId,
    resolveLocale(req),
  );
  return jsonResponse(reviews);
}
