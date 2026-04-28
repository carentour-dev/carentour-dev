import { NextRequest } from "next/server";
import { leadController } from "@/server/modules/leads/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

const LEADS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.leads"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const lead = await leadController.get(getRouteParam(ctx.params, "id"));
  return jsonResponse(lead);
}, LEADS_PERMISSIONS);

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const lead = await leadController.update(
    getRouteParam(ctx.params, "id"),
    body,
    ctx.auth,
  );
  return jsonResponse(lead);
}, LEADS_PERMISSIONS);
