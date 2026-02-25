import assert from "node:assert/strict";
import {
  REPORT_KIND_ENDPOINTS,
  REPORT_KIND_TITLES,
} from "../src/lib/finance/reportAnalytics.ts";

const expectedKinds = [
  "ap-aging",
  "ar-aging",
  "trial-balance",
  "profit-loss",
  "balance-sheet",
];

assert.deepEqual(
  Object.keys(REPORT_KIND_ENDPOINTS).sort(),
  expectedKinds.sort(),
);
assert.deepEqual(Object.keys(REPORT_KIND_TITLES).sort(), expectedKinds.sort());

assert.equal(
  REPORT_KIND_ENDPOINTS["ar-aging"],
  "/api/admin/finance/reports/ar-aging",
);
assert.equal(REPORT_KIND_TITLES["ar-aging"], "AR Aging");

assert.equal(
  REPORT_KIND_ENDPOINTS["ap-aging"],
  "/api/admin/finance/reports/ap-aging",
);
assert.equal(REPORT_KIND_TITLES["ap-aging"], "AP Aging");

assert.equal(
  REPORT_KIND_ENDPOINTS["trial-balance"],
  "/api/admin/finance/reports/trial-balance",
);
assert.equal(REPORT_KIND_TITLES["trial-balance"], "Trial Balance");

assert.equal(
  REPORT_KIND_ENDPOINTS["profit-loss"],
  "/api/admin/finance/reports/profit-loss",
);
assert.equal(REPORT_KIND_TITLES["profit-loss"], "Profit & Loss");

assert.equal(
  REPORT_KIND_ENDPOINTS["balance-sheet"],
  "/api/admin/finance/reports/balance-sheet",
);
assert.equal(REPORT_KIND_TITLES["balance-sheet"], "Balance Sheet");

console.log("finance report kind mapping tests passed");
