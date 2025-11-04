"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { patientAppointmentController } from "@/server/modules/patientAppointments/module";

const APPOINTMENT_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.appointments"],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const appointment = await patientAppointmentController.update(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(appointment);
}, APPOINTMENT_PERMISSIONS);

export const DELETE = adminRoute(async (_req: NextRequest, ctx) => {
  const result = await patientAppointmentController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
}, APPOINTMENT_PERMISSIONS);
