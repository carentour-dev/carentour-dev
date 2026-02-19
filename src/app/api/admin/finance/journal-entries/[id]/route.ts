export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeLedgerController } from "@/server/modules/finance/ledger";

const FINANCE_LEDGER_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.reports"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const data = await financeLedgerController.getJournalEntryDetail(
    ctx.params?.id,
  );
  return jsonResponse(data);
}, FINANCE_LEDGER_PERMISSIONS);
