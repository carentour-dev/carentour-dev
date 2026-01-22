import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { operationsPricingController } from "@/server/modules/operationsPricing/module";

const PRICING_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const providerId = getRouteParam(ctx.params, "id");
  const data =
    await operationsPricingController.listProviderProcedurePricing(providerId);
  return jsonResponse(data);
}, PRICING_PERMISSIONS);

export const PUT = adminRoute(async (req: NextRequest, ctx) => {
  const providerId = getRouteParam(ctx.params, "id");
  const payload = await req.json();
  const data = await operationsPricingController.upsertPriceList(
    providerId,
    payload,
  );
  return jsonResponse(data);
}, PRICING_PERMISSIONS);
