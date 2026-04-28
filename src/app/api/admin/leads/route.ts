import { NextRequest } from "next/server";
import { leadController } from "@/server/modules/leads/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const LEADS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.leads"],
} as const;

export const GET = adminRoute(async (req: NextRequest, ctx) => {
  const searchParams = req.nextUrl.searchParams;
  const assignedTo =
    searchParams.get("assignedTo") === "me"
      ? ctx.auth?.profileId
      : searchParams.get("assignedTo");

  const leads = await leadController.list({
    status: searchParams.get("status"),
    source: searchParams.get("source"),
    country: searchParams.get("country"),
    urgency: searchParams.get("urgency"),
    assignedTo,
  });

  return jsonResponse(leads);
}, LEADS_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const result = await leadController.createFromIntegration({
    ...body,
    source: body.source ?? "manual",
    channel: body.channel ?? "manual",
    rawPayload: body,
  });
  return jsonResponse(result, 201);
}, LEADS_PERMISSIONS);
