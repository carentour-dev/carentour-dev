"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientAppointmentController } from "@/server/modules/patientAppointments/module";

export const PATCH = adminRoute(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const payload = await req.json();
  const appointment = await patientAppointmentController.update(params.id, payload);
  return jsonResponse(appointment);
});

export const DELETE = adminRoute(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = await patientAppointmentController.delete(params.id);
  return jsonResponse(result);
});
