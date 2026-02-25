import { humanizeFinanceLabel } from "@/lib/finance/labels";

export const FINANCE_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export const FINANCE_APPROVAL_ENTITY_TYPES = [
  "finance_payable",
  "finance_payable_payment_group",
  "finance_credit_adjustment",
] as const;

export const FINANCE_SETTINGS_ACTIONS = [
  "payable_submit",
  "payable_payment",
] as const;

export const FINANCE_SUPPORTED_CURRENCIES = [
  "USD",
  "EGP",
  "EUR",
  "GBP",
  "SAR",
  "AED",
] as const;

export type FinanceApprovalStatus = (typeof FINANCE_APPROVAL_STATUSES)[number];

export type FinanceApprovalEntityType =
  (typeof FINANCE_APPROVAL_ENTITY_TYPES)[number];

export type FinanceSettingsAction = (typeof FINANCE_SETTINGS_ACTIONS)[number];

export type FinanceCurrencyCode = (typeof FINANCE_SUPPORTED_CURRENCIES)[number];

export type FinanceApprovalQueueApiRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  status: string;
  threshold_amount: number | null;
  currency: string | null;
  reason: string | null;
  decision_notes: string | null;
  created_at: string;
  decided_at: string | null;
};

export type FinanceApprovalQueueRowModel = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  amount: number | null;
  currency: string | null;
  reason: string | null;
  decisionNotes: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type FinanceSettingsApiModel = {
  baseCurrency: string;
  approvalThresholds: Record<string, Record<string, number>>;
  postingAccounts: Record<string, string>;
};

export type FinanceSettingsFormModel = {
  baseCurrency: FinanceCurrencyCode;
  approvalThresholds: Record<
    FinanceSettingsAction,
    Record<FinanceCurrencyCode, string>
  >;
  postingAccounts: Record<string, string>;
};

export type FinanceSettingsPatchPayload = {
  baseCurrency?: FinanceCurrencyCode;
  approvalThresholds?: Partial<
    Record<FinanceSettingsAction, Record<FinanceCurrencyCode, number>>
  >;
  postingAccounts?: Record<string, string>;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const normalizeAmount = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return roundMoney(Math.max(parsed, 0));
};

const normalizeCurrencyCode = (
  value: string,
  fallback: FinanceCurrencyCode = "EGP",
): FinanceCurrencyCode => {
  const normalized = value.trim().toUpperCase();
  if (
    FINANCE_SUPPORTED_CURRENCIES.includes(normalized as FinanceCurrencyCode)
  ) {
    return normalized as FinanceCurrencyCode;
  }
  return fallback;
};

export const formatApprovalEntityType = (value: string) => {
  switch (value) {
    case "finance_payable":
      return "Payable";
    case "finance_payable_payment_group":
      return "Payable Payment Group";
    case "finance_credit_adjustment":
      return "Credit Adjustment";
    default:
      return humanizeFinanceLabel(value);
  }
};

export function toApprovalQueueRowModel(
  row: FinanceApprovalQueueApiRow,
): FinanceApprovalQueueRowModel {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    status: row.status,
    amount:
      typeof row.threshold_amount === "number"
        ? normalizeAmount(row.threshold_amount)
        : null,
    currency:
      typeof row.currency === "string" ? row.currency.toUpperCase() : null,
    reason: row.reason,
    decisionNotes: row.decision_notes,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export function resolveApprovalDecisionEndpoint(input: {
  requestId: string;
  entityType: string;
  entityId: string;
}) {
  if (input.entityType === "finance_credit_adjustment") {
    return `/api/admin/finance/credit-adjustments/${input.entityId}/decision`;
  }

  return `/api/admin/finance/approval-requests/${input.requestId}/decision`;
}

const parseThresholdInput = (input: {
  action: FinanceSettingsAction;
  currency: FinanceCurrencyCode;
  value: string;
}) => {
  const raw = input.value.trim();
  const parsed = Number(raw.length > 0 ? raw : "0");

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Threshold for ${input.action} (${input.currency}) must be a valid number.`,
    );
  }

  if (parsed < 0) {
    throw new Error(
      `Threshold for ${input.action} (${input.currency}) cannot be negative.`,
    );
  }

  return roundMoney(parsed);
};

const normalizeSettings = (settings: FinanceSettingsApiModel) => {
  const approvalThresholds: Record<
    FinanceSettingsAction,
    Record<FinanceCurrencyCode, number>
  > = {
    payable_submit: {
      USD: 0,
      EGP: 0,
      EUR: 0,
      GBP: 0,
      SAR: 0,
      AED: 0,
    },
    payable_payment: {
      USD: 0,
      EGP: 0,
      EUR: 0,
      GBP: 0,
      SAR: 0,
      AED: 0,
    },
  };

  for (const action of FINANCE_SETTINGS_ACTIONS) {
    for (const currency of FINANCE_SUPPORTED_CURRENCIES) {
      approvalThresholds[action][currency] = normalizeAmount(
        settings.approvalThresholds?.[action]?.[currency],
      );
    }
  }

  const postingAccounts = Object.fromEntries(
    Object.entries(settings.postingAccounts ?? {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : "",
    ]),
  );

  return {
    baseCurrency: normalizeCurrencyCode(settings.baseCurrency ?? "EGP"),
    approvalThresholds,
    postingAccounts,
  };
};

export function createFinanceSettingsFormModel(
  settings: FinanceSettingsApiModel,
): FinanceSettingsFormModel {
  const normalized = normalizeSettings(settings);

  const approvalThresholds: Record<
    FinanceSettingsAction,
    Record<FinanceCurrencyCode, string>
  > = {
    payable_submit: {
      USD: "0",
      EGP: "0",
      EUR: "0",
      GBP: "0",
      SAR: "0",
      AED: "0",
    },
    payable_payment: {
      USD: "0",
      EGP: "0",
      EUR: "0",
      GBP: "0",
      SAR: "0",
      AED: "0",
    },
  };

  for (const action of FINANCE_SETTINGS_ACTIONS) {
    for (const currency of FINANCE_SUPPORTED_CURRENCIES) {
      approvalThresholds[action][currency] = String(
        normalized.approvalThresholds[action][currency],
      );
    }
  }

  return {
    baseCurrency: normalized.baseCurrency,
    approvalThresholds,
    postingAccounts: { ...normalized.postingAccounts },
  };
}

export function buildFinanceSettingsPatch(input: {
  current: FinanceSettingsApiModel;
  draft: FinanceSettingsFormModel;
}): FinanceSettingsPatchPayload {
  const current = normalizeSettings(input.current);
  const nextBaseCurrency = normalizeCurrencyCode(input.draft.baseCurrency);

  const patch: FinanceSettingsPatchPayload = {};

  if (nextBaseCurrency !== current.baseCurrency) {
    patch.baseCurrency = nextBaseCurrency;
  }

  const changedThresholds: Partial<
    Record<FinanceSettingsAction, Record<FinanceCurrencyCode, number>>
  > = {};

  for (const action of FINANCE_SETTINGS_ACTIONS) {
    const nextActionMap: Record<FinanceCurrencyCode, number> = {
      USD: 0,
      EGP: 0,
      EUR: 0,
      GBP: 0,
      SAR: 0,
      AED: 0,
    };

    let actionChanged = false;

    for (const currency of FINANCE_SUPPORTED_CURRENCIES) {
      const nextValue = parseThresholdInput({
        action,
        currency,
        value: input.draft.approvalThresholds[action][currency],
      });
      nextActionMap[currency] = nextValue;

      if (
        Math.abs(nextValue - current.approvalThresholds[action][currency]) > 0
      ) {
        actionChanged = true;
      }
    }

    if (actionChanged) {
      changedThresholds[action] = nextActionMap;
    }
  }

  if (Object.keys(changedThresholds).length > 0) {
    patch.approvalThresholds = changedThresholds;
  }

  const changedPostingAccounts: Record<string, string> = {};
  const accountKeys = new Set([
    ...Object.keys(current.postingAccounts),
    ...Object.keys(input.draft.postingAccounts ?? {}),
  ]);

  for (const key of accountKeys) {
    const rawNextValue = input.draft.postingAccounts?.[key] ?? "";
    const nextValue = rawNextValue.trim();

    if (!nextValue) {
      throw new Error(`Posting account code is required for "${key}".`);
    }

    if (nextValue !== current.postingAccounts[key]) {
      changedPostingAccounts[key] = nextValue;
    }
  }

  if (Object.keys(changedPostingAccounts).length > 0) {
    patch.postingAccounts = changedPostingAccounts;
  }

  return patch;
}

export const hasFinanceSettingsPatchChanges = (
  patch: FinanceSettingsPatchPayload,
) =>
  Boolean(
    patch.baseCurrency ||
      (patch.approvalThresholds &&
        Object.keys(patch.approvalThresholds).length > 0) ||
      (patch.postingAccounts && Object.keys(patch.postingAccounts).length > 0),
  );
