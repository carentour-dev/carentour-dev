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

export const DELETE = adminRoute(async (_req, ctx) => {
  const priceListId = getRouteParam(ctx.params, "priceListId");
  const result = await operationsPricingController.deletePriceList(priceListId);
  return jsonResponse(result);
}, PRICING_PERMISSIONS);
