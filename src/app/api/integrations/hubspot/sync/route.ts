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
    endpoint: ENDPOINT,
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
  if (delivery.duplicate) {
    return NextResponse.json(
      { data: { duplicate: true, status: delivery.status } },
      { status: 202 },
    );
  }

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
    const identityPayload = {
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      provider: "hubspot",
      external_id: payload.hubspotId,
      metadata: payload.metadata ?? {},
    };
    const { error } = await supabase
      .from("external_identities")
      .insert(identityPayload);

    if (error) {
      const duplicate =
        error.code === "23505" ||
        error.message?.toLowerCase().includes("duplicate key") === true;
      if (!duplicate) {
        throw new ApiError(
          500,
          "Failed to store HubSpot identity",
          error.message,
        );
      }

      const { data: existingIdentity, error: existingError } = await supabase
        .from("external_identities")
        .select("entity_type, entity_id")
        .eq("provider", "hubspot")
        .eq("external_id", payload.hubspotId)
        .maybeSingle();

      if (existingError) {
        throw new ApiError(
          500,
          "Failed to resolve HubSpot identity",
          existingError.message,
        );
      }

      if (
        !existingIdentity ||
        existingIdentity.entity_type !== payload.entityType ||
        existingIdentity.entity_id !== payload.entityId
      ) {
        throw new ApiError(
          409,
          "HubSpot identity already belongs to another record.",
        );
      }

      const { error: metadataError } = await supabase
        .from("external_identities")
        .update({ metadata: payload.metadata ?? {} })
        .eq("provider", "hubspot")
        .eq("external_id", payload.hubspotId)
        .eq("entity_type", payload.entityType)
        .eq("entity_id", payload.entityId);

      if (metadataError) {
        throw new ApiError(
          500,
          "Failed to update HubSpot identity metadata",
          metadataError.message,
        );
      }
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
