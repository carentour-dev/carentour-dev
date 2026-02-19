export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financePayablesController } from "@/server/modules/finance/payables";

const FINANCE_APPROVAL_REQUESTS_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.payables", "finance.approvals"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const searchParams = new URL(req.url).searchParams;
  const status = searchParams.get("status");
  const entityType = searchParams.get("entityType");
  const data = await financePayablesController.listApprovalRequests({
    status,
    entityType,
  });

  return jsonResponse(data);
}, FINANCE_APPROVAL_REQUESTS_PERMISSIONS);
