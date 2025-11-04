export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientController } from "@/server/modules/patients/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

export const GET = adminRoute(async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return jsonResponse([]);
  }

  const patients = await patientController.search(query);
  return jsonResponse(patients);
}, SHARED_PERMISSIONS);
