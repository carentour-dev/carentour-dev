import assert from "node:assert/strict";
import {
  buildFinanceSettingsPatch,
  createFinanceSettingsFormModel,
  hasFinanceSettingsPatchChanges,
  type FinanceSettingsApiModel,
} from "../src/lib/finance/adminConsoles.ts";

const currentSettings: FinanceSettingsApiModel = {
  baseCurrency: "EGP",
  approvalThresholds: {
    payable_submit: {
      USD: 2000,
      EGP: 100000,
      EUR: 1800,
      GBP: 1600,
      SAR: 7500,
      AED: 7300,
    },
    payable_payment: {
      USD: 2000,
      EGP: 100000,
      EUR: 1800,
      GBP: 1600,
      SAR: 7500,
      AED: 7300,
    },
  },
  postingAccounts: {
    accounts_receivable: "1100",
    accounts_payable: "2100",
    revenue: "4000",
    cash_bank: "1000",
  },
};

const form = createFinanceSettingsFormModel(currentSettings);
assert.equal(form.baseCurrency, "EGP");
assert.equal(form.approvalThresholds.payable_submit.USD, "2000");
assert.equal(form.postingAccounts.accounts_payable, "2100");

const unchangedPatch = buildFinanceSettingsPatch({
  current: currentSettings,
  draft: form,
});

assert.equal(hasFinanceSettingsPatchChanges(unchangedPatch), false);

const changedDraft = {
  ...form,
  baseCurrency: "USD" as const,
  approvalThresholds: {
    ...form.approvalThresholds,
    payable_submit: {
      ...form.approvalThresholds.payable_submit,
      USD: "2500",
    },
  },
  postingAccounts: {
    ...form.postingAccounts,
    revenue: "4010",
  },
};

const changedPatch = buildFinanceSettingsPatch({
  current: currentSettings,
  draft: changedDraft,
});

assert.equal(changedPatch.baseCurrency, "USD");
assert.equal(changedPatch.postingAccounts?.revenue, "4010");
assert.equal(changedPatch.approvalThresholds?.payable_submit?.USD, 2500);
assert.ok(
  changedPatch.approvalThresholds?.payable_submit &&
    Object.keys(changedPatch.approvalThresholds.payable_submit).length === 6,
);

assert.throws(
  () =>
    buildFinanceSettingsPatch({
      current: currentSettings,
      draft: {
        ...form,
        approvalThresholds: {
          ...form.approvalThresholds,
          payable_submit: {
            ...form.approvalThresholds.payable_submit,
            USD: "-1",
          },
        },
      },
    }),
  /cannot be negative/i,
);

assert.throws(
  () =>
    buildFinanceSettingsPatch({
      current: currentSettings,
      draft: {
        ...form,
        postingAccounts: {
          ...form.postingAccounts,
          revenue: "",
        },
      },
    }),
  /account code is required/i,
);

console.log("finance settings payload tests passed");
