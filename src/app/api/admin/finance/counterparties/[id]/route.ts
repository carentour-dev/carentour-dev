export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financePayablesController } from "@/server/modules/finance/payables";

const FINANCE_COUNTERPARTIES_PERMISSIONS = {
  allPermissions: [
    "finance.access",
    "finance.shared",
    "finance.counterparties",
  ],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const result = await financePayablesController.updateCounterparty(
    ctx.params?.id,
    payload,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(result);
}, FINANCE_COUNTERPARTIES_PERMISSIONS);

export const DELETE = adminRoute(async (_req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const result = await financePayablesController.deleteCounterparty(
    ctx.params?.id,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(result);
}, FINANCE_COUNTERPARTIES_PERMISSIONS);
