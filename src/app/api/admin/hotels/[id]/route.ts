import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { hotelController } from "@/server/modules/hotels/module";

export const GET = adminRoute(async (_req, ctx) => {
  const hotel = await hotelController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(hotel);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const hotel = await hotelController.update(
    getRouteParam(ctx.params, "id"),
    body,
  );
  return jsonResponse(hotel);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await hotelController.delete(getRouteParam(ctx.params, "id"));
  return jsonResponse(result);
});
