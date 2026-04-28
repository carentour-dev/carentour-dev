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

const ENDPOINT = "/api/integrations/ad-leads";

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
      provider: "ad-leads",
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
    provider: "ad-leads",
    body,
    signatureValid: true,
    status: "accepted",
  });

  if (!isTruthyFeatureFlag(process.env.LEADS_ENABLE_GOOGLE_META_INGESTION)) {
    await updateWebhookDelivery(delivery.id, {
      status: "failed",
      error_message: "Google/Meta ingestion is disabled.",
    });
    return NextResponse.json(
      { error: "Google/Meta ingestion is disabled." },
      { status: 403 },
    );
  }

  try {
    const payload = JSON.parse(body);
    const source = payload.source ?? payload.platform ?? "ad_lead";
    const result = await leadController.createFromIntegration({
      ...payload,
      source,
      channel: payload.channel ?? "paid_social",
      provider: payload.provider ?? source,
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
