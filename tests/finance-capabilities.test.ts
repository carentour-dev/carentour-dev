import assert from "node:assert/strict";
import { resolveFinanceCapabilities } from "../src/lib/finance/capabilities.ts";

const operatorCaps = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.payables",
]);

assert.equal(operatorCaps.hasFinanceWorkspaceAccess, true);
assert.equal(operatorCaps.canManagePayables, true);
assert.equal(operatorCaps.canViewApprovalsQueue, true);
assert.equal(operatorCaps.canDecideApprovals, false);
assert.equal(operatorCaps.canManageSettings, false);

const approverCaps = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.approvals",
  "finance.reports",
]);

assert.equal(approverCaps.canViewApprovalsQueue, true);
assert.equal(approverCaps.canDecideApprovals, true);
assert.equal(approverCaps.canManagePayables, false);
assert.equal(approverCaps.canRunLedgerBackfill, true);

const managerCaps = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.settings",
  "finance.counterparties",
]);

assert.equal(managerCaps.canManageSettings, true);
assert.equal(managerCaps.canRunCounterpartySync, true);
assert.equal(managerCaps.canViewSettingsConsole, true);

const adminCaps = resolveFinanceCapabilities(["admin.access"]);

assert.equal(adminCaps.isAdmin, true);
assert.equal(adminCaps.canManageSettings, true);
assert.equal(adminCaps.canDecideApprovals, true);
assert.equal(adminCaps.canManagePayables, true);
assert.equal(adminCaps.canConvertQuotes, true);

const adminByRoleCaps = resolveFinanceCapabilities([], ["Admin"]);
assert.equal(adminByRoleCaps.isAdmin, true);
assert.equal(adminByRoleCaps.hasFinanceWorkspaceAccess, true);
assert.equal(adminByRoleCaps.canManageInvoices, true);

console.log("finance capabilities tests passed");
