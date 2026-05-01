import { NextRequest } from "next/server";
import { patientJourneyController } from "@/server/modules/patientJourneys/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const MANAGE_JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patient_journeys.manage"],
} as const;

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const journey = await patientJourneyController.start(body, ctx.auth);
  return jsonResponse(journey, 201);
}, MANAGE_JOURNEY_PERMISSIONS);
