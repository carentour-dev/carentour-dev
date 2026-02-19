export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financePayablesController } from "@/server/modules/finance/payables";

const FINANCE_COUNTERPARTY_SYNC_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.counterparties", "finance.settings"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const limit = new URL(req.url).searchParams.get("limit");
  const data =
    await financePayablesController.getCounterpartySyncHistory(limit);

  return jsonResponse(data);
}, FINANCE_COUNTERPARTY_SYNC_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const data = await financePayablesController.reconcileCounterparties(
    payload,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(data);
}, FINANCE_COUNTERPARTY_SYNC_PERMISSIONS);
