import { NextRequest, NextResponse } from "next/server";
import { leadController } from "@/server/modules/leads/module";
import {
  logWebhookDelivery,
  updateWebhookDelivery,
  verifyIntegrationWebhook,
} from "@/server/modules/leads/webhooks";
import { isTruthyFeatureFlag } from "@/lib/leads/normalization";
import { handleRouteError } from "@/server/utils/http";

export const runtime = "nodejs";

const ENDPOINT = "/api/integrations/whatsapp/inbound";

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
      provider: "whatsapp",
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
    provider: "whatsapp",
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

  if (!isTruthyFeatureFlag(process.env.LEADS_ENABLE_WHATSAPP_INGESTION)) {
    await updateWebhookDelivery(delivery.id, {
      status: "failed",
      error_message: "WhatsApp ingestion is disabled.",
    });
    return NextResponse.json(
      { error: "WhatsApp ingestion is disabled." },
      { status: 403 },
    );
  }

  try {
    const payload = JSON.parse(body);
    const result = await leadController.createFromIntegration({
      ...payload,
      source: payload.source ?? "whatsapp",
      channel: payload.channel ?? "whatsapp",
      provider: payload.provider ?? "whatsapp",
      rawPayload: payload,
    });
    await updateWebhookDelivery(delivery.id, { status: "processed" });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    await updateWebhookDelivery(delivery.id, {
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    });
    return handleRouteError(error);
  }
}
