import { createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/server/utils/errors";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const parseSignature = (value: string | null) => {
  if (!value) {
    return null;
  }

  return value.trim().replace(/^sha256=/i, "");
};

const safeCompare = (left: string, right: string) => {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  } catch {
    return false;
  }
};

export const verifyIntegrationWebhook = (args: {
  body: string;
  endpoint: string;
  timestampHeader: string | null;
  signatureHeader: string | null;
  now?: number;
}) => {
  const secret = process.env.INTEGRATION_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiError(
      500,
      "INTEGRATION_WEBHOOK_SECRET is not configured on the server.",
    );
  }

  const timestamp = Number(args.timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: "Missing or invalid webhook timestamp." };
  }

  const timestampMs = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  const now = args.now ?? Date.now();

  if (Math.abs(now - timestampMs) > FIVE_MINUTES_MS) {
    return { valid: false, reason: "Webhook timestamp is stale." };
  }

  const providedSignature = parseSignature(args.signatureHeader);
  if (!providedSignature) {
    return { valid: false, reason: "Missing webhook signature." };
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${args.timestampHeader}.${args.endpoint}.${args.body}`)
    .digest("hex");

  if (!safeCompare(providedSignature, expectedSignature)) {
    return { valid: false, reason: "Webhook signature is invalid." };
  }

  return { valid: true, reason: null };
};
