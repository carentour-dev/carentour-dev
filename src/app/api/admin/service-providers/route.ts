import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { serviceProviderController } from "@/server/modules/serviceProviders/module";

export const GET = adminRoute(async () => {
  const serviceProviders = await serviceProviderController.list();
  return jsonResponse(serviceProviders);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const serviceProvider = await serviceProviderController.create(body);
  return jsonResponse(serviceProvider, 201);
});
