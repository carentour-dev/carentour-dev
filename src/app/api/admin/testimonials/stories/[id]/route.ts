import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientStories } from "@/server/modules/testimonials/stories";
import { getRouteParam } from "@/server/utils/params";

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const id = getRouteParam(ctx.params, "id");
  const body = await req.json();
  const updated = await patientStories.update(id, body);
  return jsonResponse(updated);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const id = getRouteParam(ctx.params, "id");
  const result = await patientStories.remove(id);
  return jsonResponse(result);
});
