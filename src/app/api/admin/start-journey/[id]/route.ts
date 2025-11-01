import { NextRequest } from "next/server";
import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

export const GET = adminRoute(async (_req, ctx) => {
  const submission = await startJourneySubmissionController.get(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(submission);
});

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const updated = await startJourneySubmissionController.update(
    getRouteParam(ctx.params, "id"),
    body,
  );
  return jsonResponse(updated);
});

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await startJourneySubmissionController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
});
