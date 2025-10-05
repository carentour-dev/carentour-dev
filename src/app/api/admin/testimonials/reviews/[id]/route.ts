import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { testimonialReviews } from "@/server/modules/testimonials/reviews";
import { getRouteParam } from "@/server/utils/params";

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const id = getRouteParam(ctx.params, "id");
  const body = await req.json();
  const updated = await testimonialReviews.update(id, body);
  return jsonResponse(updated);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const id = getRouteParam(ctx.params, "id");
  const result = await testimonialReviews.remove(id);
  return jsonResponse(result);
});
