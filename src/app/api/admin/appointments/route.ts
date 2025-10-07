"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { appointmentStatusValues, patientAppointmentController } from "@/server/modules/patientAppointments/module";

const isValidStatus = (value: string | null): value is (typeof appointmentStatusValues)[number] => {
  if (!value) return false;
  return appointmentStatusValues.includes(value as (typeof appointmentStatusValues)[number]);
};

export const GET = adminRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;

  const filters: {
    status?: (typeof appointmentStatusValues)[number];
    patientId?: string;
    upcomingOnly?: boolean;
  } = {};

  const statusParam = params.get("status");
  const patientId = params.get("patientId");
  const upcomingOnly = params.get("upcomingOnly");

  if (isValidStatus(statusParam)) {
    filters.status = statusParam;
  }

  if (patientId && patientId.trim().length > 0) {
    filters.patientId = patientId.trim();
  }

  if (upcomingOnly !== null) {
    filters.upcomingOnly = upcomingOnly === "true";
  }

  const appointments = await patientAppointmentController.list(filters);
  return jsonResponse(appointments);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const payload = await req.json();
  const appointment = await patientAppointmentController.create(payload);
  return jsonResponse(appointment);
});
