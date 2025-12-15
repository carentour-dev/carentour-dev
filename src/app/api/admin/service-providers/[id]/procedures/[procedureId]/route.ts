import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { treatmentController } from "@/server/modules/treatments/module";

export const DELETE = adminRoute(async (_req, ctx) => {
  const result = await treatmentController.deleteProviderProcedure(
    getRouteParam(ctx.params, "id"),
    getRouteParam(ctx.params, "procedureId"),
  );

  return jsonResponse(result);
});
