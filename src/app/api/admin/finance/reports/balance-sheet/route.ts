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

  const dateTo = new URL(req.url).searchParams.get("dateTo");
  const data = await financeReportsController.getBalanceSheetReport({ dateTo });

  return jsonResponse(data);
}, FINANCE_REPORTS_PERMISSIONS);
