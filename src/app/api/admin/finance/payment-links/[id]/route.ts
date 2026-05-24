export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeController } from "@/server/modules/finance/module";

const FINANCE_PAYMENT_LINK_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.invoices"],
} as const;

export const PUT = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const paymentLinkId = ctx.params?.id;
  const payload = await req.json();
  const link = await financeController.updatePaymentLink(
    paymentLinkId,
    payload,
    {
      userId,
      profileId: ctx.auth?.profileId ?? null,
      permissions: ctx.auth?.permissions ?? [],
    },
  );

  return jsonResponse(link);
}, FINANCE_PAYMENT_LINK_PERMISSIONS);
