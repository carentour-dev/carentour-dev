import { NextRequest, NextResponse } from "next/server";
import { leadController } from "@/server/modules/leads/module";
import {
  logWebhookDelivery,
  updateWebhookDelivery,
  verifyIntegrationWebhook,
} from "@/server/modules/leads/webhooks";
import { handleRouteError } from "@/server/utils/http";

export const runtime = "nodejs";

const ENDPOINT = "/api/integrations/leads";

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
      body,
      signatureValid: false,
      status: "rejected",
      errorMessage: verification.reason,
    });

    return NextResponse.json(
      { error: verification.reason ?? "Webhook rejected" },
      { status: 401 },
    );
  }

  const delivery = await logWebhookDelivery({
    req,
    endpoint: ENDPOINT,
    body,
    signatureValid: true,
    status: "accepted",
  });

  try {
    const payload = JSON.parse(body);
    const result = await leadController.createFromIntegration(payload);
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
