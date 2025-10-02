import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { treatmentController } from "@/server/modules/treatments/module";

export const GET = adminRoute(async (_req, ctx) => {
  const treatment = await treatmentController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(treatment);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const treatment = await treatmentController.update(getRouteParam(ctx.params, "id"), body);
  return jsonResponse(treatment);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await treatmentController.delete(getRouteParam(ctx.params, "id"));
  return jsonResponse(result);
});
