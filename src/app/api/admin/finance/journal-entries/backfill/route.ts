export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeLedgerPosting } from "@/server/modules/finance/ledger";

const FINANCE_LEDGER_BACKFILL_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.settings", "finance.approvals"],
} as const;

export const POST = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const data = await financeLedgerPosting.runBackfill({
    userId,
    profileId: ctx.auth?.profileId ?? null,
    permissions: ctx.auth?.permissions ?? [],
  });

  return jsonResponse(data, 201);
}, FINANCE_LEDGER_BACKFILL_PERMISSIONS);
