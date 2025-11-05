import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { patientController } from "@/server/modules/patients/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

const PATIENTS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patients"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const patient = await patientController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(patient);
}, SHARED_PERMISSIONS);

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const patient = await patientController.update(
    getRouteParam(ctx.params, "id"),
    body,
    ctx.auth,
  );
  return jsonResponse(patient);
}, PATIENTS_PERMISSIONS);

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await patientController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
}, PATIENTS_PERMISSIONS);
