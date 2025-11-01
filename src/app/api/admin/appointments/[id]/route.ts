"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { patientAppointmentController } from "@/server/modules/patientAppointments/module";

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const appointment = await patientAppointmentController.update(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(appointment);
});

export const DELETE = adminRoute(async (_req: NextRequest, ctx) => {
  const result = await patientAppointmentController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
});
