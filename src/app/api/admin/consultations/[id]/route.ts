"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { patientConsultationController } from "@/server/modules/patientConsultations/module";

const CONSULTATION_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.consultations"],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const consultation = await patientConsultationController.update(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(consultation);
}, CONSULTATION_PERMISSIONS);

export const DELETE = adminRoute(async (_req: NextRequest, ctx) => {
  const result = await patientConsultationController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
}, CONSULTATION_PERMISSIONS);
