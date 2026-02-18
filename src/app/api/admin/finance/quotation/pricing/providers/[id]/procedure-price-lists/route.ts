import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { operationsPricingController } from "@/server/modules/operationsPricing/module";

const FINANCE_QUOTATION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.orders", "finance.invoices"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const providerId = getRouteParam(ctx.params, "id");
  const data =
    await operationsPricingController.listProviderProcedurePricing(providerId);
  return jsonResponse(data);
}, FINANCE_QUOTATION_PERMISSIONS);

export const PUT = adminRoute(async (req: NextRequest, ctx) => {
  const providerId = getRouteParam(ctx.params, "id");
  const payload = await req.json();
  const data = await operationsPricingController.upsertPriceList(
    providerId,
    payload,
  );
  return jsonResponse(data);
}, FINANCE_QUOTATION_PERMISSIONS);
