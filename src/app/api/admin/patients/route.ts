import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientController } from "@/server/modules/patients/module";
import { PatientStatusEnum, type PatientStatus } from "@/lib/patients/status";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

const PATIENTS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patients"],
} as const;

const parseStatusQuery = (value: string | null): PatientStatus | undefined => {
  if (!value) {
    return undefined;
  }
  const result = PatientStatusEnum.safeParse(value);
  return result.success ? result.data : undefined;
};

export const GET = adminRoute(async (req: NextRequest) => {
  const status = parseStatusQuery(req.nextUrl.searchParams.get("status"));
  const patients = await patientController.list({ status });
  return jsonResponse(patients);
}, SHARED_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const patient = await patientController.create(body, ctx.auth);
  return jsonResponse(patient, 201);
}, PATIENTS_PERMISSIONS);
