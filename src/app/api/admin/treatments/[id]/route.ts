import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { treatmentController } from "@/server/modules/treatments/module";

const TREATMENTS_READ_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.testimonials"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const treatment = await treatmentController.get(
    getRouteParam(ctx.params, "id"),
    resolveAdminLocale(req),
  );
  return jsonResponse(treatment);
}, TREATMENTS_READ_PERMISSIONS);

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const treatment = await treatmentController.update(
    getRouteParam(ctx.params, "id"),
    body,
    resolveAdminLocale(req),
  );
  return jsonResponse(treatment);
});

export const DELETE = adminRoute(async (req, ctx) => {
  const result = await treatmentController.delete(
    getRouteParam(ctx.params, "id"),
    resolveAdminLocale(req),
  );
  return jsonResponse(result);
});
