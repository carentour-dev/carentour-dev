import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { serviceProviderController } from "@/server/modules/serviceProviders/module";

export const GET = adminRoute(async (_req, ctx) => {
  const serviceProvider = await serviceProviderController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(serviceProvider);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const serviceProvider = await serviceProviderController.update(getRouteParam(ctx.params, "id"), body);
  return jsonResponse(serviceProvider);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await serviceProviderController.delete(getRouteParam(ctx.params, "id"));
  return jsonResponse(result);
});
