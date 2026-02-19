import assert from "node:assert/strict";
import {
  PAYABLE_SETTLEMENT_OPEN_STATUSES,
  PAYABLE_SETTLEMENT_POSTABLE_STATUSES,
  canCancelPayableStatus,
  canEditPayableStatus,
  canPostPayableSettlement,
  canRecordPayableSettlement,
  canSubmitPayableStatus,
} from "../src/lib/finance/payablesState.ts";

assert.deepEqual(PAYABLE_SETTLEMENT_OPEN_STATUSES, [
  "approved",
  "scheduled",
  "partially_paid",
]);

assert.deepEqual(PAYABLE_SETTLEMENT_POSTABLE_STATUSES, [
  "approved",
  "scheduled",
  "partially_paid",
  "paid",
]);

assert.equal(canEditPayableStatus("draft"), true);
assert.equal(canEditPayableStatus("approved"), false);
assert.equal(canSubmitPayableStatus("draft"), true);
assert.equal(canSubmitPayableStatus("cancelled"), false);
assert.equal(canCancelPayableStatus("draft"), true);
assert.equal(canCancelPayableStatus("paid"), false);

assert.equal(canRecordPayableSettlement("approved", 100), true);
assert.equal(canRecordPayableSettlement("scheduled", "25.55"), true);
assert.equal(canRecordPayableSettlement(" PARTIALLY_PAID ", 5), true);
assert.equal(canRecordPayableSettlement("approved", 0), false);
assert.equal(canRecordPayableSettlement("approved", -1), false);
assert.equal(canRecordPayableSettlement("approved", "not-a-number"), false);
assert.equal(canRecordPayableSettlement("cancelled", 10), false);

assert.equal(canPostPayableSettlement("approved"), true);
assert.equal(canPostPayableSettlement("scheduled"), true);
assert.equal(canPostPayableSettlement("partially_paid"), true);
assert.equal(canPostPayableSettlement("paid"), true);
assert.equal(canPostPayableSettlement("draft"), false);
assert.equal(canPostPayableSettlement("reversed"), false);

console.log("finance payables state tests passed");
