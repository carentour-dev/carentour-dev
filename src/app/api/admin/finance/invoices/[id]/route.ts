export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_INVOICE_DETAIL_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.invoices", "finance.payments", "finance.reports"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const invoiceId = ctx.params?.id;
  const detail = await financeController.getInvoiceDetail(invoiceId);

  return jsonResponse(detail);
}, FINANCE_INVOICE_DETAIL_PERMISSIONS);
