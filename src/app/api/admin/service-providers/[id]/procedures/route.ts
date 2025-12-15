import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { treatmentController } from "@/server/modules/treatments/module";

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const procedure = await treatmentController.createProviderProcedure(
    getRouteParam(ctx.params, "id"),
    body,
  );

  return jsonResponse(procedure, 201);
});
