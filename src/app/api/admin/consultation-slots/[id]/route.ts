"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { consultationSlotController } from "@/server/modules/consultationSlots/module";

const SLOT_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.consultations"],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const payload = await req.json();
  const slot = await consultationSlotController.update(
    getRouteParam(ctx.params, "id"),
    payload,
  );
  return jsonResponse(slot);
}, SLOT_PERMISSIONS);

export const DELETE = adminRoute(async (_req: NextRequest, ctx) => {
  const result = await consultationSlotController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
}, SLOT_PERMISSIONS);
