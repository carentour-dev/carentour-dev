"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  appointmentBookingController,
  appointmentBookingStatusValues,
} from "@/server/modules/appointmentBookings/module";
import type { BackofficeAccessOptions } from "@/server/auth/requireAdmin";

const BOOKING_PERMISSIONS: BackofficeAccessOptions = {
  allPermissions: ["operations.shared", "operations.appointments"],
};

const isValidStatus = (
  value: string | null,
): value is (typeof appointmentBookingStatusValues)[number] => {
  if (!value) return false;
  return appointmentBookingStatusValues.includes(
    value as (typeof appointmentBookingStatusValues)[number],
  );
};

export const GET = adminRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const filters: {
    status?: (typeof appointmentBookingStatusValues)[number];
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

  const bookings = await appointmentBookingController.list(filters);
  return jsonResponse(bookings);
}, BOOKING_PERMISSIONS);
