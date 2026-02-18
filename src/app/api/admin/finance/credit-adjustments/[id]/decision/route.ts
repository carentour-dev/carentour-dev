export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_CREDIT_ADJUSTMENT_DECISION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.approvals"],
} as const;

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const adjustmentId = ctx.params?.id;
  const payload = await req.json();
  const result = await financeController.decideCreditAdjustment(
    adjustmentId,
    payload,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(result);
}, FINANCE_CREDIT_ADJUSTMENT_DECISION_PERMISSIONS);
