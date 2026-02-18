export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_CREDIT_ADJUSTMENTS_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.payments"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const status = new URL(req.url).searchParams.get("status");
  const result = await financeController.listCreditAdjustments(status);

  return jsonResponse(result);
}, FINANCE_CREDIT_ADJUSTMENTS_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const result = await financeController.requestCreditAdjustment(payload, {
    userId,
    profileId: ctx.auth?.profileId ?? null,
    permissions: ctx.auth?.permissions ?? [],
  });

  return jsonResponse(result, 201);
}, FINANCE_CREDIT_ADJUSTMENTS_PERMISSIONS);
