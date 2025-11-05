export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientController } from "@/server/modules/patients/module";
import { PatientStatusEnum, type PatientStatus } from "@/lib/patients/status";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

const parseStatusQuery = (value: string | null): PatientStatus | undefined => {
  if (!value) {
    return undefined;
  }
  const result = PatientStatusEnum.safeParse(value);
  return result.success ? result.data : undefined;
};

export const GET = adminRoute(async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const status = parseStatusQuery(request.nextUrl.searchParams.get("status"));

  if (query.length < 2) {
    return jsonResponse([]);
  }

  const patients = await patientController.search(query, { status });
  return jsonResponse(patients);
}, SHARED_PERMISSIONS);
