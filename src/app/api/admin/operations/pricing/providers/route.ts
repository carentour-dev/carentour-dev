import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { operationsPricingController } from "@/server/modules/operationsPricing/module";

const PRICING_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

const querySchema = z.object({
  partnerOnly: z.coerce.boolean().optional(),
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
}, PRICING_PERMISSIONS);
