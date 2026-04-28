import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
export { verifyIntegrationWebhook } from "@/lib/leads/webhook-signature";

export const hashWebhookPayload = (body: string) =>
  createHash("sha256").update(body).digest("hex");

const headersToJson = (req: NextRequest) => {
  const headers: Record<string, string> = {};
  for (const [key, value] of req.headers.entries()) {
    if (key.toLowerCase() === "authorization") {
      continue;
    }
    headers[key] = value;
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
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .insert({
      endpoint: args.endpoint,
      provider: args.provider ?? null,
      payload_hash: hashWebhookPayload(args.body),
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
    throw new ApiError(500, "Failed to log webhook delivery", error.message);
  }

  return data as { id: string };
};

export const updateWebhookDelivery = async (
  id: string,
  payload: {
    status: "processed" | "failed";
    error_message?: string | null;
  },
) => {
  const supabase = getSupabaseAdmin() as any;
  await supabase
    .from("webhook_deliveries")
    .update({
      status: payload.status,
      error_message: payload.error_message ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
};
