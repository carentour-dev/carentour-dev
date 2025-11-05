import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { patientController } from "@/server/modules/patients/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const patientId = getRouteParam(ctx.params, "id");
  const details = await patientController.details(patientId);
  return jsonResponse(details);
}, SHARED_PERMISSIONS);
