import assert from "node:assert/strict";
import { resolveFinanceCapabilities } from "../src/lib/finance/capabilities.ts";

const operator = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.orders",
  "finance.invoices",
  "finance.payments",
  "finance.payables",
  "finance.counterparties",
  "finance.reports",
]);

assert.equal(operator.canManageInvoices, true);
assert.equal(operator.canRecordPayments, true);
assert.equal(operator.canManagePayables, true);
assert.equal(operator.canViewApprovalsConsole, true);
assert.equal(operator.canDecideApprovals, false);
assert.equal(operator.canManageSettings, false);

const approver = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.approvals",
  "finance.reports",
]);

assert.equal(approver.canViewApprovalsConsole, true);
assert.equal(approver.canDecideApprovals, true);
assert.equal(approver.canManagePayables, false);
assert.equal(approver.canRecordPayments, false);
assert.equal(approver.canViewSettingsConsole, true);
assert.equal(approver.canRunLedgerBackfill, true);

const manager = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.reports",
  "finance.settings",
  "finance.approvals",
  "finance.counterparties",
]);

assert.equal(manager.canManageSettings, true);
assert.equal(manager.canViewSettingsConsole, true);
assert.equal(manager.canRunCounterpartySync, true);
assert.equal(manager.canRunLedgerBackfill, true);

const analyst = resolveFinanceCapabilities([
  "finance.access",
  "finance.shared",
  "finance.reports",
]);

assert.equal(analyst.canViewReports, true);
assert.equal(analyst.canViewApprovalsConsole, false);
assert.equal(analyst.canViewSettingsConsole, false);
assert.equal(analyst.canRunCounterpartySync, false);
assert.equal(analyst.canRunLedgerBackfill, false);

const adminMirror = resolveFinanceCapabilities(["admin.access"]);
assert.equal(adminMirror.canViewApprovalsConsole, true);
assert.equal(adminMirror.canViewSettingsConsole, true);

const adminRoleMirror = resolveFinanceCapabilities([], ["ADMIN"]);
assert.equal(adminRoleMirror.canViewApprovalsConsole, true);
assert.equal(adminRoleMirror.canViewSettingsConsole, true);

console.log("finance role-matrix smoke tests passed");
