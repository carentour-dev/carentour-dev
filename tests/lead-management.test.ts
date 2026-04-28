import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  canContactViaChannel,
  isTruthyFeatureFlag,
  normalizeLeadEmail,
  normalizeLeadPhone,
  splitLeadName,
} from "../src/lib/leads/normalization.ts";

assert.equal(normalizeLeadEmail("  LEAD@Example.COM "), "lead@example.com");
assert.equal(normalizeLeadEmail("   "), null);
assert.equal(normalizeLeadEmail(null), null);

assert.equal(normalizeLeadPhone("+20 100 123 4567"), "+201001234567");
assert.equal(normalizeLeadPhone("001 (555) 123-4567"), "0015551234567");
assert.equal(normalizeLeadPhone("123"), null);

assert.deepEqual(splitLeadName("Mona Hassan Ali"), {
  fullName: "Mona Hassan Ali",
  firstName: "Mona",
  lastName: "Hassan Ali",
});
assert.deepEqual(splitLeadName("Mona"), {
  fullName: "Mona",
  firstName: "Mona",
  lastName: null,
});

assert.equal(isTruthyFeatureFlag("true"), true);
assert.equal(isTruthyFeatureFlag("enabled"), true);
assert.equal(isTruthyFeatureFlag("false"), false);
assert.equal(
  canContactViaChannel({ channel: "whatsapp", optedIn: true }),
  true,
);
assert.equal(canContactViaChannel({ channel: "email", optedIn: false }), false);

process.env.INTEGRATION_WEBHOOK_SECRET = "test-secret";
const { verifyIntegrationWebhook } = await import(
  "../src/lib/leads/webhook-signature.ts"
);
const body = JSON.stringify({ source: "meta", email: "lead@example.com" });
const timestamp = "1777286400";
const signature = createHmac("sha256", "test-secret")
  .update(`${timestamp}.${body}`)
  .digest("hex");

assert.deepEqual(
  verifyIntegrationWebhook({
    body,
    timestampHeader: timestamp,
    signatureHeader: `sha256=${signature}`,
    now: 1777286400 * 1000,
  }),
  { valid: true, reason: null },
);

assert.equal(
  verifyIntegrationWebhook({
    body,
    timestampHeader: timestamp,
    signatureHeader: "sha256=bad",
    now: 1777286400 * 1000,
  }).valid,
  false,
);

assert.equal(
  verifyIntegrationWebhook({
    body,
    timestampHeader: timestamp,
    signatureHeader: `sha256=${signature}`,
    now: 1777286400 * 1000 + 6 * 60 * 1000,
  }).reason,
  "Webhook timestamp is stale.",
);

console.log("lead management tests passed");
