import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
export { verifyIntegrationWebhook } from "@/lib/leads/webhook-signature";

export const hashWebhookPayload = (body: string) =>
  createHash("sha256").update(body).digest("hex");

const SAFE_HEADER_NAMES = new Set([
  "content-type",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip",
  "x-vercel-id",
]);

const headersToJson = (req: NextRequest) => {
  const headers: Record<string, string> = {};
  for (const [key, value] of req.headers.entries()) {
    const normalizedKey = key.toLowerCase();
    if (!SAFE_HEADER_NAMES.has(normalizedKey)) {
      continue;
    }
    headers[normalizedKey] = value;
  }
  return headers;
};

const parseJsonPayload = (body: string) => {
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : { value: parsed };
  } catch {
    return { raw: body };
  }
};

export const logWebhookDelivery = async (args: {
  req: NextRequest;
  endpoint: string;
  provider?: string | null;
  body: string;
  signatureValid: boolean;
  status: "accepted" | "rejected" | "processed" | "failed";
  errorMessage?: string | null;
}) => {
  const supabase = getSupabaseAdmin() as any;
  const payloadHash = hashWebhookPayload(args.body);
  const provider = args.provider ?? "unknown";
  const deliveryId =
    args.req.headers.get("x-carentour-delivery-id") ??
    args.req.headers.get("x-provider-delivery-id") ??
    args.req.headers.get("x-hubspot-event-id") ??
    null;
  const deliveryKey = deliveryId
    ? `${args.endpoint}:${provider}:event:${deliveryId}`
    : `${args.endpoint}:${provider}:payload:${payloadHash}`;
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .insert({
      endpoint: args.endpoint,
      provider: args.provider ?? null,
      delivery_key: deliveryKey,
      payload_hash: payloadHash,
      signature_valid: args.signatureValid,
      status: args.status,
      error_message: args.errorMessage ?? null,
      raw_payload: parseJsonPayload(args.body),
      request_headers: headersToJson(args.req),
      processed_at:
        args.status === "processed" || args.status === "failed"
          ? new Date().toISOString()
          : null,
    })
    .select("*")
    .single();

  if (error) {
    const duplicate =
      error.code === "23505" ||
      error.message?.toLowerCase().includes("duplicate key") === true;
    if (duplicate) {
      const { data: existingDelivery, error: existingError } = await supabase
        .from("webhook_deliveries")
        .select("id, status")
        .eq("delivery_key", deliveryKey)
        .maybeSingle();

      if (!existingError && existingDelivery) {
        return {
          id: existingDelivery.id,
          status: existingDelivery.status,
          duplicate: true,
        } as {
          id: string;
          status: "accepted" | "rejected" | "processed" | "failed";
          duplicate: boolean;
        };
      }
    }
    throw new ApiError(500, "Failed to log webhook delivery", error.message);
  }

  return {
    id: data.id,
    status: data.status,
    duplicate: false,
  } as {
    id: string;
    status: "accepted" | "rejected" | "processed" | "failed";
    duplicate: boolean;
  };
};

export const updateWebhookDelivery = async (
  id: string,
  payload: {
    status: "processed" | "failed";
    error_message?: string | null;
  },
) => {
  const supabase = getSupabaseAdmin() as any;
  const { error } = await supabase
    .from("webhook_deliveries")
    .update({
      status: payload.status,
      error_message: payload.error_message ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.warn("[leads] failed to update webhook delivery", {
      id,
      status: payload.status,
      error: error.message,
    });
    return false;
  }

  return true;
};
