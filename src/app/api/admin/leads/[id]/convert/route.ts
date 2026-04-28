import { NextRequest } from "next/server";
import { leadController } from "@/server/modules/leads/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";

const LEADS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.leads"],
} as const;

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const result = await leadController.convert(
    getRouteParam(ctx.params, "id"),
    body,
    ctx.auth,
  );
  return jsonResponse(result);
}, LEADS_PERMISSIONS);
