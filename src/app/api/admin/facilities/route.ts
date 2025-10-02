import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { facilityController } from "@/server/modules/facilities/module";

export const GET = adminRoute(async () => {
  const facilities = await facilityController.list();
  return jsonResponse(facilities);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const facility = await facilityController.create(body);
  return jsonResponse(facility, 201);
});
