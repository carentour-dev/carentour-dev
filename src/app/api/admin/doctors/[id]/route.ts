import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { doctorController } from "@/server/modules/doctors/module";

export const GET = adminRoute(async (_req, ctx) => {
  const doctor = await doctorController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(doctor);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const doctor = await doctorController.update(
    getRouteParam(ctx.params, "id"),
    body,
  );
  return jsonResponse(doctor);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await doctorController.delete(getRouteParam(ctx.params, "id"));
  return jsonResponse(result);
});
