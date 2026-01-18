import { operationsQuotesController } from "@/server/modules/operationsQuotes/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";

const QUOTES_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const quoteId = ctx.params?.id;
  const quote = await operationsQuotesController.get(quoteId, userId);
  return jsonResponse(quote);
}, QUOTES_PERMISSIONS);
