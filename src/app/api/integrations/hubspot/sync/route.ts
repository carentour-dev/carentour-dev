import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import {
  logWebhookDelivery,
  updateWebhookDelivery,
  verifyIntegrationWebhook,
} from "@/server/modules/leads/webhooks";
import { isTruthyFeatureFlag } from "@/lib/leads/normalization";
import { handleRouteError } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";

export const runtime = "nodejs";

const ENDPOINT = "/api/integrations/hubspot/sync";

const syncSchema = z.object({
  entityType: z.enum([
    "lead",
    "patient",
    "contact_request",
    "start_journey_submission",
  ]),
  entityId: z.string().uuid(),
  hubspotId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const verification = verifyIntegrationWebhook({
    body,
    timestampHeader: req.headers.get("x-carentour-timestamp"),
    signatureHeader: req.headers.get("x-carentour-signature"),
  });

  if (!verification.valid) {
    await logWebhookDelivery({
      req,
      endpoint: ENDPOINT,
      provider: "hubspot",
      body,
      signatureValid: false,
      status: "rejected",
      errorMessage: verification.reason,
    });
    return NextResponse.json({ error: verification.reason }, { status: 401 });
  }

  const delivery = await logWebhookDelivery({
    req,
    endpoint: ENDPOINT,
    provider: "hubspot",
    body,
    signatureValid: true,
    status: "accepted",
  });

  if (!isTruthyFeatureFlag(process.env.LEADS_ENABLE_HUBSPOT_SYNC)) {
    await updateWebhookDelivery(delivery.id, {
      status: "failed",
      error_message: "HubSpot sync is disabled.",
    });
    return NextResponse.json(
      { error: "HubSpot sync is disabled." },
      { status: 403 },
    );
  }

  try {
    const payload = syncSchema.parse(JSON.parse(body));
    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase.from("external_identities").upsert(
      {
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        provider: "hubspot",
        external_id: payload.hubspotId,
        metadata: payload.metadata ?? {},
      },
      { onConflict: "provider,external_id" },
    );

    if (error) {
      throw new ApiError(
        500,
        "Failed to store HubSpot identity",
        error.message,
      );
    }

    await updateWebhookDelivery(delivery.id, { status: "processed" });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    await updateWebhookDelivery(delivery.id, {
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    });
    return handleRouteError(error);
  }
}
