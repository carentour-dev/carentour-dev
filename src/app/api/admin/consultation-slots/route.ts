"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  consultationBookingTypeValues,
  consultationSlotController,
  consultationSlotStatusValues,
} from "@/server/modules/consultationSlots/module";

const SLOT_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.consultations"],
} as const;

const isValidBookingType = (value: string | null) =>
  Boolean(
    value &&
      consultationBookingTypeValues.includes(
        value as (typeof consultationBookingTypeValues)[number],
      ),
  );

const isValidStatus = (value: string | null) =>
  Boolean(
    value &&
      consultationSlotStatusValues.includes(
        value as (typeof consultationSlotStatusValues)[number],
      ),
  );

export const GET = adminRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const filters: {
    doctorId?: string;
    bookingType?: (typeof consultationBookingTypeValues)[number];
    status?: (typeof consultationSlotStatusValues)[number];
    from?: string;
    to?: string;
  } = {};

  const doctorId = params.get("doctorId");
  const bookingType = params.get("bookingType");
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");

  if (doctorId?.trim()) filters.doctorId = doctorId.trim();
  if (isValidBookingType(bookingType)) {
    filters.bookingType =
      bookingType as (typeof consultationBookingTypeValues)[number];
  }
  if (isValidStatus(status)) {
    filters.status = status as (typeof consultationSlotStatusValues)[number];
  }
  if (from?.trim()) filters.from = from.trim();
  if (to?.trim()) filters.to = to.trim();

  const slots = await consultationSlotController.list(filters);
  return jsonResponse(slots);
}, SLOT_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const slot = await consultationSlotController.create(
    payload,
    ctx.auth?.profileId ?? null,
  );
  return jsonResponse(slot, 201);
}, SLOT_PERMISSIONS);
