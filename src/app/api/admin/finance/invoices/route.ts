export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_INVOICES_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.invoices"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const invoices = await financeController.listInvoices();
  return jsonResponse(invoices);
}, FINANCE_INVOICES_PERMISSIONS);
