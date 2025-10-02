import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { facilityController } from "@/server/modules/facilities/module";

export const GET = adminRoute(async (_req, ctx) => {
  const facility = await facilityController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(facility);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const facility = await facilityController.update(getRouteParam(ctx.params, "id"), body);
  return jsonResponse(facility);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await facilityController.delete(getRouteParam(ctx.params, "id"));
  return jsonResponse(result);
});
