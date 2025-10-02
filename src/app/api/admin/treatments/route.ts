import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { treatmentController } from "@/server/modules/treatments/module";

export const GET = adminRoute(async () => {
  const treatments = await treatmentController.list();
  return jsonResponse(treatments);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const treatment = await treatmentController.create(body);
  return jsonResponse(treatment, 201);
});
