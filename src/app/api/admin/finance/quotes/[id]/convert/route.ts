export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_CONVERT_PERMISSIONS = {
  allPermissions: [
    "finance.access",
    "finance.shared",
    "finance.orders",
    "finance.invoices",
  ],
} as const;

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const quoteId = ctx.params?.id;
  const result = await financeController.convertQuoteToInvoice(
    quoteId,
    payload,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(result);
}, FINANCE_CONVERT_PERMISSIONS);
