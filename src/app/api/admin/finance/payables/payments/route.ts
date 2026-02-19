export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financePayablesController } from "@/server/modules/finance/payables";

const FINANCE_PAYABLES_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.payables"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const data = await financePayablesController.listPayablePayments(null);
  return jsonResponse(data);
}, FINANCE_PAYABLES_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const data = await financePayablesController.recordPayablePayment(payload, {
    userId,
    profileId: ctx.auth?.profileId ?? null,
    permissions: ctx.auth?.permissions ?? [],
  });

  return jsonResponse(data, 201);
}, FINANCE_PAYABLES_PERMISSIONS);
