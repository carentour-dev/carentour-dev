import { NextRequest } from "next/server";
import { patientJourneyController } from "@/server/modules/patientJourneys/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

export const POST = adminRoute(
  async (req: NextRequest, ctx) => {
    const journey = await patientJourneyController.createStep(
      getRouteParam(ctx.params, "id"),
      await req.json(),
      ctx.auth,
    );

    return jsonResponse(journey, 201);
  },
  {
    allPermissions: ["operations.shared", "operations.patient_journeys.manage"],
  },
);

export const PATCH = adminRoute(
  async (req: NextRequest, ctx) => {
    const journey = await patientJourneyController.reorderSteps(
      getRouteParam(ctx.params, "id"),
      await req.json(),
      ctx.auth,
    );

    return jsonResponse(journey);
  },
  {
    allPermissions: ["operations.shared", "operations.patient_journeys.manage"],
  },
);
