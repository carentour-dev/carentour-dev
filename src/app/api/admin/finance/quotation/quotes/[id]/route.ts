import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { operationsQuotesController } from "@/server/modules/operationsQuotes/module";

const FINANCE_QUOTATION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.orders", "finance.invoices"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const quoteId = ctx.params?.id;
  const quote = await operationsQuotesController.get(quoteId);
  return jsonResponse(quote);
}, FINANCE_QUOTATION_PERMISSIONS);

export const PUT = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const quoteId = ctx.params?.id;
  const payload = await req.json();
  const quote = await operationsQuotesController.update(quoteId, payload);

  return jsonResponse(quote);
}, FINANCE_QUOTATION_PERMISSIONS);
