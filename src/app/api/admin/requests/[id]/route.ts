"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { contactRequestController } from "@/server/modules/contactRequests/module";

const REQUEST_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.requests"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const request = await contactRequestController.get(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(request);
}, REQUEST_PERMISSIONS);

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const request = await contactRequestController.update(
    getRouteParam(ctx.params, "id"),
    body,
  );
  return jsonResponse(request);
}, REQUEST_PERMISSIONS);

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await contactRequestController.delete(
    getRouteParam(ctx.params, "id"),
  );
  return jsonResponse(result);
}, REQUEST_PERMISSIONS);
