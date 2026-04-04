import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { treatmentController } from "@/server/modules/treatments/module";

const TREATMENTS_READ_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.testimonials"],
} as const;

export const GET = adminRoute(async (req: NextRequest) => {
  const treatments = await treatmentController.list(resolveAdminLocale(req));
  return jsonResponse(treatments);
}, TREATMENTS_READ_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const treatment = await treatmentController.create(
    body,
    resolveAdminLocale(req),
  );
  return jsonResponse(treatment, 201);
});
