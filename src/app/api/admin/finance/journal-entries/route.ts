export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { ApiError } from "@/server/utils/errors";
import { jsonResponse } from "@/server/utils/http";
import { financeLedgerController } from "@/server/modules/finance/ledger";

const FINANCE_LEDGER_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared", "finance.reports"],
} as const;

export const GET = adminRoute(async (req, ctx) => {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const searchParams = new URL(req.url).searchParams;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sourceType = searchParams.get("sourceType");

  const data = await financeLedgerController.listJournalEntries({
    dateFrom,
    dateTo,
    sourceType,
  });

  return jsonResponse(data);
}, FINANCE_LEDGER_PERMISSIONS);
