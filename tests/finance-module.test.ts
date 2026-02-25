import assert from "node:assert/strict";
import {
  applyPaymentAllocation,
  buildArAgingReport,
  generateInstallmentSchedule,
  resolveCreditAdjustmentWorkflow,
} from "../src/server/modules/finance/logic.ts";

const generated = generateInstallmentSchedule({
  totalAmount: 1000,
  issueDate: "2026-02-01",
  template: [
    { label: "Deposit", percent: 30, dueInDays: 0 },
    { label: "Pre-arrival", percent: 50, dueInDays: 14 },
    { label: "Final", percent: 20, dueInDays: 30 },
  ],
});

assert.equal(generated.length, 3);
assert.equal(generated[0]?.amount, 300);
assert.equal(generated[1]?.amount, 500);
assert.equal(generated[2]?.amount, 200);
assert.equal(generated[0]?.dueDate, "2026-02-01");
assert.equal(generated[1]?.dueDate, "2026-02-15");
assert.equal(generated[2]?.dueDate, "2026-03-03");

const paymentResult = applyPaymentAllocation({
  paymentAmount: 450,
  invoiceTotalAmount: 1000,
  invoicePaidAmount: 0,
  invoiceStatus: "issued",
  installments: [
    {
      id: "ins-1",
      label: "Deposit",
      percent: 30,
      amount: 300,
      paidAmount: 0,
      balanceAmount: 300,
      dueDate: "2026-02-10",
      status: "pending",
      displayOrder: 0,
      metadata: {},
    },
    {
      id: "ins-2",
      label: "Pre-arrival",
      percent: 50,
      amount: 500,
      paidAmount: 0,
      balanceAmount: 500,
      dueDate: "2026-02-20",
      status: "pending",
      displayOrder: 1,
      metadata: {},
    },
    {
      id: "ins-3",
      label: "Final",
      percent: 20,
      amount: 200,
      paidAmount: 0,
      balanceAmount: 200,
      dueDate: "2026-03-01",
      status: "pending",
      displayOrder: 2,
      metadata: {},
    },
  ],
  asOfDate: "2026-02-17",
});

const updatedDeposit = paymentResult.installments.find(
  (item) => item.id === "ins-1",
);
const updatedSecond = paymentResult.installments.find(
  (item) => item.id === "ins-2",
);
assert.equal(updatedDeposit?.paidAmount, 300);
assert.equal(updatedDeposit?.status, "paid");
assert.equal(updatedSecond?.paidAmount, 150);
assert.equal(updatedSecond?.balanceAmount, 350);
assert.equal(updatedSecond?.status, "partially_paid");
assert.equal(paymentResult.invoicePaidAmount, 450);
assert.equal(paymentResult.invoiceBalanceAmount, 550);
assert.equal(paymentResult.invoiceStatus, "partially_paid");

const aging = buildArAgingReport({
  asOfDate: "2026-02-17",
  rows: [
    {
      invoiceId: "inv-1",
      invoiceNumber: "INV-2026-00001",
      patientId: "pat-1",
      installmentId: "ins-1",
      installmentLabel: "Deposit",
      dueDate: "2026-01-05",
      balanceAmount: 300,
      currency: "USD",
    },
    {
      invoiceId: "inv-1",
      invoiceNumber: "INV-2026-00001",
      patientId: "pat-1",
      installmentId: "ins-2",
      installmentLabel: "Pre-arrival",
      dueDate: "2026-02-25",
      balanceAmount: 350,
      currency: "USD",
    },
  ],
});

assert.equal(aging.totalAmount, 650);
assert.equal(aging.buckets["31_60"].amount, 300);
assert.equal(aging.buckets.current.amount, 350);
assert.ok(aging.rows.some((row) => row.bucket === "31_60"));

const refundWorkflowNoApprover = resolveCreditAdjustmentWorkflow({
  adjustmentType: "refund",
  actorPermissions: ["finance.access", "finance.payments"],
  requestedAutoApprove: true,
});
assert.equal(refundWorkflowNoApprover.requiresApproval, true);
assert.equal(refundWorkflowNoApprover.hasPrivilege, false);
assert.equal(refundWorkflowNoApprover.nextStatus, "pending");
assert.equal(refundWorkflowNoApprover.requireAuditEvent, true);

const writeoffWorkflowApprover = resolveCreditAdjustmentWorkflow({
  adjustmentType: "writeoff",
  actorPermissions: ["finance.approvals"],
  requestedAutoApprove: true,
});
assert.equal(writeoffWorkflowApprover.requiresApproval, true);
assert.equal(writeoffWorkflowApprover.hasPrivilege, true);
assert.equal(writeoffWorkflowApprover.nextStatus, "pending");

const creditNoteWorkflowApprover = resolveCreditAdjustmentWorkflow({
  adjustmentType: "credit_note",
  actorPermissions: ["finance.approvals"],
  requestedAutoApprove: true,
});
assert.equal(creditNoteWorkflowApprover.requiresApproval, false);
assert.equal(creditNoteWorkflowApprover.nextStatus, "approved");

const creditNoteWorkflowDefault = resolveCreditAdjustmentWorkflow({
  adjustmentType: "credit_note",
  actorPermissions: ["finance.payments"],
  requestedAutoApprove: false,
});
assert.equal(creditNoteWorkflowDefault.requiresApproval, false);
assert.equal(creditNoteWorkflowDefault.hasPrivilege, true);
assert.equal(creditNoteWorkflowDefault.nextStatus, "approved");

console.log("finance module logic tests passed");
