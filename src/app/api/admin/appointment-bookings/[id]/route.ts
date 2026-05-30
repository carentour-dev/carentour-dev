"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { appointmentBookingController } from "@/server/modules/appointmentBookings/module";
import type { BackofficeAccessOptions } from "@/server/auth/requireAdmin";

const BOOKING_PERMISSIONS: BackofficeAccessOptions = {
  allPermissions: ["operations.shared", "operations.appointments"],
};

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const booking = await appointmentBookingController.update(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(booking);
}, BOOKING_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const booking = await appointmentBookingController.performAction(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(booking);
}, BOOKING_PERMISSIONS);
