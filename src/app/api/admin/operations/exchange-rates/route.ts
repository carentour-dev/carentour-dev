export const dynamic = "force-dynamic";

import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { fetchBanqueMisrRates } from "@/server/modules/exchangeRates/banqueMisr";

const EXCHANGE_RATES_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

export const GET = adminRoute(async () => {
  const rates = await fetchBanqueMisrRates();
  return jsonResponse(rates);
}, EXCHANGE_RATES_PERMISSIONS);
