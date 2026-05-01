import { NextRequest } from "next/server";
import { patientJourneyController } from "@/server/modules/patientJourneys/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

const JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patient_journeys.read"],
} as const;

const MANAGE_JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patient_journeys.manage"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const journey = await patientJourneyController.get(
    getRouteParam(ctx.params, "id"),
    ctx.auth,
  );
  return jsonResponse(journey);
}, JOURNEY_PERMISSIONS);

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const journey = await patientJourneyController.update(
    getRouteParam(ctx.params, "id"),
    await req.json(),
    ctx.auth,
  );
  return jsonResponse(journey);
}, MANAGE_JOURNEY_PERMISSIONS);
