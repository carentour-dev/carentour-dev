import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientController } from "@/server/modules/patients/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

const PATIENTS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patients"],
} as const;

export const GET = adminRoute(async () => {
  const patients = await patientController.list();
  return jsonResponse(patients);
}, SHARED_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const patient = await patientController.create(body);
  return jsonResponse(patient, 201);
}, PATIENTS_PERMISSIONS);
