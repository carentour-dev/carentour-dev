export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeReportsController } from "@/server/modules/finance/reports";

const FINANCE_REPORTS_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.reports"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const searchParams = new URL(req.url).searchParams;
  const data = await financeReportsController.getProfitLossReport({
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo"),
  });

  return jsonResponse(data);
}, FINANCE_REPORTS_PERMISSIONS);
