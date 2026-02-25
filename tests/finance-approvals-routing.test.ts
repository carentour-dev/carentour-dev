import assert from "node:assert/strict";
import {
  resolveApprovalDecisionEndpoint,
  toApprovalQueueRowModel,
} from "../src/lib/finance/adminConsoles.ts";

const payableEndpoint = resolveApprovalDecisionEndpoint({
  requestId: "req-payable",
  entityType: "finance_payable",
  entityId: "payable-1",
});

assert.equal(
  payableEndpoint,
  "/api/admin/finance/approval-requests/req-payable/decision",
);

const paymentGroupEndpoint = resolveApprovalDecisionEndpoint({
  requestId: "req-payment-group",
  entityType: "finance_payable_payment_group",
  entityId: "group-1",
});

assert.equal(
  paymentGroupEndpoint,
  "/api/admin/finance/approval-requests/req-payment-group/decision",
);

const adjustmentEndpoint = resolveApprovalDecisionEndpoint({
  requestId: "req-adjustment",
  entityType: "finance_credit_adjustment",
  entityId: "adjustment-1",
});

assert.equal(
  adjustmentEndpoint,
  "/api/admin/finance/credit-adjustments/adjustment-1/decision",
);

const mapped = toApprovalQueueRowModel({
  id: "req-1",
  entity_type: "finance_credit_adjustment",
  entity_id: "adj-1",
  action: "refund",
  status: "pending",
  threshold_amount: 2500,
  currency: "usd",
  reason: "patient_refund_policy",
  decision_notes: null,
  created_at: "2026-02-20T10:00:00.000Z",
  decided_at: null,
});

assert.equal(mapped.id, "req-1");
assert.equal(mapped.entityType, "finance_credit_adjustment");
assert.equal(mapped.entityId, "adj-1");
assert.equal(mapped.amount, 2500);
assert.equal(mapped.currency, "USD");

console.log("finance approvals routing tests passed");
