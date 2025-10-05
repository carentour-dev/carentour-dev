import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { doctorTreatmentsController } from "@/server/modules/doctorTreatments/module";

export const GET = adminRoute(async (req: NextRequest) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  if (!category) {
    return jsonResponse({ error: "Missing category query parameter" }, 400);
  }

  const doctors = await doctorTreatmentsController.list(category);
  return jsonResponse({ doctors });
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const result = await doctorTreatmentsController.setAssignments(body);
  return jsonResponse(result);
});
