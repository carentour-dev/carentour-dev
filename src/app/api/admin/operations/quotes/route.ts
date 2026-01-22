export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { operationsQuotesController } from "@/server/modules/operationsQuotes/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";

const QUOTES_PERMISSIONS = {
  allPermissions: [
    "operations.access",
    "operations.shared",
    "operations.quotation_calculator",
  ],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const quotes = await operationsQuotesController.list();
  return jsonResponse(quotes);
}, QUOTES_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const payload = await req.json();
  const quote = await operationsQuotesController.create(payload, {
    userId,
    profileId: ctx.auth?.profileId ?? null,
  });

  return jsonResponse(quote, 201);
}, QUOTES_PERMISSIONS);
