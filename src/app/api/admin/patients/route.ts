import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientController } from "@/server/modules/patients/module";

export const GET = adminRoute(async () => {
  const patients = await patientController.list();
  return jsonResponse(patients);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const patient = await patientController.create(body);
  return jsonResponse(patient, 201);
});
