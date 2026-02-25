import assert from "node:assert/strict";
import {
  canEditPayableDraft,
  hasPendingPayableSubmitApproval,
} from "../src/lib/finance/payablesState.ts";

assert.equal(
  hasPendingPayableSubmitApproval([
    {
      entity_type: "finance_payable",
      action: "payable_submit",
      status: "pending",
    },
  ]),
  true,
);

assert.equal(
  hasPendingPayableSubmitApproval([
    {
      entity_type: "finance_payable",
      action: "payable_submit",
      status: "approved",
    },
  ]),
  false,
);

assert.equal(
  hasPendingPayableSubmitApproval([
    {
      entity_type: " finance_payable ",
      action: " PAYABLE_SUBMIT ",
      status: " PENDING ",
    },
  ]),
  true,
);

assert.equal(
  canEditPayableDraft({
    status: "draft",
    approvals: [],
  }),
  true,
);

assert.equal(
  canEditPayableDraft({
    status: "approved",
    approvals: [],
  }),
  false,
);

assert.equal(
  canEditPayableDraft({
    status: "draft",
    approvals: [
      {
        entity_type: "finance_payable",
        action: "payable_submit",
        status: "pending",
      },
    ],
  }),
  false,
);

assert.equal(
  canEditPayableDraft({
    status: "draft",
    approvals: [
      {
        entity_type: "finance_payable",
        action: "payable_payment",
        status: "pending",
      },
    ],
  }),
  true,
);

console.log("finance payable editor guard tests passed");
