export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financePayablesController } from "@/server/modules/finance/payables";

const FINANCE_COUNTERPARTIES_READ_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.payables", "finance.counterparties"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const searchParams = new URL(req.url).searchParams;
  const kind = searchParams.get("kind");
  const isActive = searchParams.get("isActive");
  const search = searchParams.get("search");
  const sourceType = searchParams.get("sourceType");
  const data = await financePayablesController.listCounterparties({
    kind,
    isActive,
    search,
    sourceType,
  });

  return jsonResponse(data);
}, FINANCE_COUNTERPARTIES_READ_PERMISSIONS);

export const POST = adminRoute(
  async (req: NextRequest, ctx) => {
    const userId = ctx.auth?.user.id;
    if (!userId) {
      throw new ApiError(401, "Missing authenticated user");
    }

    const payload = await req.json();
    const data = await financePayablesController.createCounterparty(payload, {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    });

    return jsonResponse(data, 201);
  },
  {
    allPermissions: [
      "finance.access",
      "finance.shared",
      "finance.counterparties",
    ],
  },
);
