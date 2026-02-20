import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { operationsPricingController } from "@/server/modules/operationsPricing/module";

const FINANCE_QUOTATION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.orders", "finance.invoices"],
} as const;

const querySchema = z.object({
  partnerOnly: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().toLowerCase();
      return normalized.length > 0 ? normalized : undefined;
    },
    z
      .enum(["true", "false", "1", "0", "yes", "no", "y", "n"])
      .transform((value) => ["true", "1", "yes", "y"].includes(value))
      .optional(),
  ),
});

export const GET = adminRoute(async (req) => {
  const searchParams = new URL(req.url).searchParams;
  const parsed = querySchema.parse({
    partnerOnly: searchParams.get("partnerOnly") ?? undefined,
  });

  const providers = await operationsPricingController.listProviders({
    partnerOnly: parsed.partnerOnly ?? false,
  });

  return jsonResponse(providers);
}, FINANCE_QUOTATION_PERMISSIONS);
