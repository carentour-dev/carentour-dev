import { NextRequest } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { operationsPricingController } from "@/server/modules/operationsPricing/module";

const FINANCE_QUOTATION_PERMISSIONS = {
  allPermissions: ["finance.access", "finance.shared"],
  anyPermissions: ["finance.orders", "finance.invoices", "finance.settings"],
} as const;

const importRequestSchema = z.object({
  mode: z.enum(["dry_run", "apply"]),
  rows: z.array(z.array(z.string())).optional(),
  runId: z.string().uuid().optional(),
  options: z
    .object({
      createMissing: z.boolean().optional(),
    })
    .optional(),
});

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const providerId = getRouteParam(ctx.params, "id");
  const payload = importRequestSchema.parse(await req.json());
  const { mode } = payload;

  const actor = {
    scope: "finance" as const,
    permissions: ctx.auth?.permissions ?? [],
    userId: ctx.auth?.user.id ?? null,
    profileId: ctx.auth?.profileId ?? null,
  };

  const data =
    mode === "dry_run"
      ? await operationsPricingController.previewPriceListImport(
          providerId,
          payload,
          actor,
        )
      : await operationsPricingController.applyPriceListImport(
          providerId,
          payload,
          actor,
        );

  return jsonResponse(data);
}, FINANCE_QUOTATION_PERMISSIONS);
