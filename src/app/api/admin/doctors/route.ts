import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { doctorController } from "@/server/modules/doctors/module";

const SHARED_PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

export const GET = adminRoute(async (req: NextRequest) => {
  const doctors = await doctorController.list(resolveAdminLocale(req));
  return jsonResponse(doctors);
}, SHARED_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const doctor = await doctorController.create(body, resolveAdminLocale(req));
  return jsonResponse(doctor, 201);
});
