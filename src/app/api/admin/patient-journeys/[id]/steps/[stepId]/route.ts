import { NextRequest } from "next/server";
import { patientJourneyController } from "@/server/modules/patientJourneys/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

const STEP_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patient_journeys.read"],
  anyPermissions: [
    "operations.patient_journeys.manage",
    "operations.patient_journey_steps.update_assigned",
  ],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const journey = await patientJourneyController.updateStep(
    getRouteParam(ctx.params, "id"),
    getRouteParam(ctx.params, "stepId"),
    await req.json(),
    ctx.auth,
  );

  return jsonResponse(journey);
}, STEP_PERMISSIONS);
