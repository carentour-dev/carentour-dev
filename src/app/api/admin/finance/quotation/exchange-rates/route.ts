export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { fetchBanqueMisrRates } from "@/server/modules/exchangeRates/banqueMisr";

const FINANCE_QUOTATION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.orders", "finance.invoices"],
} as const;

export const GET = adminRoute(async () => {
  const rates = await fetchBanqueMisrRates();
  return jsonResponse(rates);
}, FINANCE_QUOTATION_PERMISSIONS);
