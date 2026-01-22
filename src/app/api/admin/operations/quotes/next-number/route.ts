export const dynamic = "force-dynamic";

import { operationsQuotesController } from "@/server/modules/operationsQuotes/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";

const QUOTES_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

export const POST = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const quoteNumber = await operationsQuotesController.reserveNextQuoteNumber();
  return jsonResponse({ quoteNumber });
}, QUOTES_PERMISSIONS);
