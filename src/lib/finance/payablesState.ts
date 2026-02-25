const PAYABLE_SETTLEMENT_OPEN_STATUSES_INTERNAL = [
  "approved",
  "scheduled",
  "partially_paid",
] as const;

const PAYABLE_SETTLEMENT_POSTABLE_STATUSES_INTERNAL = [
  ...PAYABLE_SETTLEMENT_OPEN_STATUSES_INTERNAL,
  "paid",
] as const;

export const PAYABLE_SETTLEMENT_OPEN_STATUSES = [
  ...PAYABLE_SETTLEMENT_OPEN_STATUSES_INTERNAL,
];

export const PAYABLE_SETTLEMENT_POSTABLE_STATUSES = [
  ...PAYABLE_SETTLEMENT_POSTABLE_STATUSES_INTERNAL,
];

const normalizeStatus = (status?: string | null) =>
  typeof status === "string" ? status.trim().toLowerCase() : "";

const normalizeMoney = (value: unknown) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100) / 100;
};

export const canEditPayableStatus = (status?: string | null) =>
  normalizeStatus(status) === "draft";

export const canSubmitPayableStatus = (status?: string | null) =>
  normalizeStatus(status) === "draft";

export const canCancelPayableStatus = (status?: string | null) =>
  normalizeStatus(status) === "draft";

export const canRecordPayableSettlement = (
  status?: string | null,
  balanceAmount?: unknown,
) =>
  PAYABLE_SETTLEMENT_OPEN_STATUSES_INTERNAL.includes(
    normalizeStatus(
      status,
    ) as (typeof PAYABLE_SETTLEMENT_OPEN_STATUSES_INTERNAL)[number],
  ) && normalizeMoney(balanceAmount) > 0;

export const canPostPayableSettlement = (status?: string | null) =>
  PAYABLE_SETTLEMENT_POSTABLE_STATUSES_INTERNAL.includes(
    normalizeStatus(
      status,
    ) as (typeof PAYABLE_SETTLEMENT_POSTABLE_STATUSES_INTERNAL)[number],
  );

export type PayableApprovalGuardInput = {
  entity_type?: string | null;
  action?: string | null;
  status?: string | null;
};

export const hasPendingPayableSubmitApproval = (
  approvals?: PayableApprovalGuardInput[] | null,
) =>
  (approvals ?? []).some(
    (approval) =>
      normalizeStatus(approval.entity_type) === "finance_payable" &&
      normalizeStatus(approval.action) === "payable_submit" &&
      normalizeStatus(approval.status) === "pending",
  );

export const canEditPayableDraft = (input: {
  status?: string | null;
  approvals?: PayableApprovalGuardInput[] | null;
}) =>
  canEditPayableStatus(input.status) &&
  !hasPendingPayableSubmitApproval(input.approvals);
