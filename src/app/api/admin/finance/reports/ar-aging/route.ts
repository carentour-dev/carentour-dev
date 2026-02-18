export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_REPORTS_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.reports"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const searchParams = new URL(req.url).searchParams;
  const asOfDate = searchParams.get("asOfDate");
  const report = await financeController.getArAgingReport(asOfDate);

  return jsonResponse(report);
}, FINANCE_REPORTS_PERMISSIONS);
