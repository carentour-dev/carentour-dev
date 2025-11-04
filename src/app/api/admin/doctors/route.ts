import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { doctorController } from "@/server/modules/doctors/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

export const GET = adminRoute(async () => {
  const doctors = await doctorController.list();
  return jsonResponse(doctors);
}, SHARED_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const doctor = await doctorController.create(body);
  return jsonResponse(doctor, 201);
});
