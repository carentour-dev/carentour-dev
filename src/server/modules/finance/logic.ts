export type FinanceInvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void"
  | "cancelled";

export type FinanceInstallmentStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type FinanceCreditAdjustmentType = "refund" | "writeoff" | "credit_note";

export type FinanceInstallmentTemplateItem = {
  label: string;
  percent: number;
  dueInDays?: number | null;
  dueDate?: string | null;
  notes?: string | null;
};

export type FinanceGeneratedInstallment = {
  label: string;
  percent: number;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: FinanceInstallmentStatus;
  displayOrder: number;
  metadata: Record<string, unknown>;
};

export type FinanceInstallmentState = FinanceGeneratedInstallment & {
  id: string;
};

export type FinanceAllocationInput = {
  installmentId?: string | null;
  amount: number;
};

export type FinanceAppliedAllocation = {
  installmentId: string | null;
  amount: number;
};

export type FinanceArAgingBucket =
  | "current"
  | "1_30"
  | "31_60"
  | "61_90"
  | "90_plus";

export type FinanceArAgingInputRow = {
  invoiceId: string;
  invoiceNumber?: string | null;
  patientId?: string | null;
  installmentId?: string | null;
  installmentLabel?: string | null;
  dueDate: string;
  balanceAmount: number;
  currency: string;
};

export type FinanceArAgingOutputRow = FinanceArAgingInputRow & {
  daysPastDue: number;
  bucket: FinanceArAgingBucket;
};

const EPSILON = 0.005;
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const defaultInstallmentTemplate: FinanceInstallmentTemplateItem[] = [
  { label: "Deposit", percent: 30, dueInDays: 0 },
  { label: "Pre-arrival", percent: 50, dueInDays: 14 },
  { label: "Final balance", percent: 20, dueInDays: 30 },
];

const toDateOnly = (value?: string | Date | null): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    if (ISO_DATE_ONLY_REGEX.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString().slice(0, 10);
  }

  if (!Number.isFinite(value.getTime())) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const addDays = (value: string, days: number) => {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundPercent = (value: number) => Math.round(value * 10000) / 10000;

const nonNegative = (value: number) => (value < 0 ? 0 : value);

const compareInstallments = (
  a: Pick<FinanceInstallmentState, "dueDate" | "displayOrder">,
  b: Pick<FinanceInstallmentState, "dueDate" | "displayOrder">,
) => {
  const dueCompare = a.dueDate.localeCompare(b.dueDate);
  if (dueCompare !== 0) {
    return dueCompare;
  }
  return a.displayOrder - b.displayOrder;
};

const resolveInstallmentDueDate = (
  issueDate: string,
  item: FinanceInstallmentTemplateItem,
) => {
  const explicitDueDate = toDateOnly(item.dueDate);
  if (explicitDueDate) {
    return explicitDueDate;
  }

  const dueInDays = Number.isFinite(item.dueInDays ?? NaN)
    ? Math.max(0, Math.floor(item.dueInDays ?? 0))
    : 0;

  return addDays(issueDate, dueInDays);
};

export const normalizeInstallmentTemplate = (
  template: Array<Partial<FinanceInstallmentTemplateItem>> | null | undefined,
) => {
  const source = Array.isArray(template) ? template : [];
  const parsed = source
    .map((item, index) => {
      const label = String(item?.label ?? "").trim();
      const rawPercent = Number(item?.percent);
      const percent = Number.isFinite(rawPercent) ? rawPercent : 0;
      const dueInDays = Number(item?.dueInDays);
      const normalizedDueInDays = Number.isFinite(dueInDays)
        ? Math.max(0, Math.floor(dueInDays))
        : 0;
      const dueDate = toDateOnly(item?.dueDate);
      const notes =
        typeof item?.notes === "string" && item.notes.trim().length > 0
          ? item.notes.trim()
          : null;

      return {
        label: label.length > 0 ? label : `Installment ${index + 1}`,
        percent: nonNegative(percent),
        dueInDays: normalizedDueInDays,
        dueDate,
        notes,
      };
    })
    .filter((item) => item.percent > 0);

  const workingSet = parsed.length > 0 ? parsed : defaultInstallmentTemplate;
  const totalPercent = workingSet.reduce((sum, item) => sum + item.percent, 0);

  if (totalPercent <= 0) {
    return defaultInstallmentTemplate;
  }

  let runningPercent = 0;
  return workingSet.map((item, index) => {
    if (index === workingSet.length - 1) {
      const remaining = roundPercent(100 - runningPercent);
      return {
        ...item,
        percent: remaining > 0 ? remaining : 0,
      };
    }

    const normalized = roundPercent((item.percent / totalPercent) * 100);
    runningPercent = roundPercent(runningPercent + normalized);

    return {
      ...item,
      percent: normalized,
    };
  });
};

export const generateInstallmentSchedule = (input: {
  totalAmount: number;
  issueDate: string;
  template?: Array<Partial<FinanceInstallmentTemplateItem>> | null;
}) => {
  const totalAmount = roundMoney(nonNegative(Number(input.totalAmount) || 0));
  const issueDate =
    toDateOnly(input.issueDate) ?? new Date().toISOString().slice(0, 10);
  const normalizedTemplate = normalizeInstallmentTemplate(input.template);

  let allocated = 0;
  const installments: FinanceGeneratedInstallment[] = normalizedTemplate.map(
    (item, index) => {
      const amount =
        index === normalizedTemplate.length - 1
          ? roundMoney(totalAmount - allocated)
          : roundMoney((totalAmount * item.percent) / 100);

      allocated = roundMoney(allocated + amount);

      const dueDate = resolveInstallmentDueDate(issueDate, item);

      return {
        label: item.label,
        percent: item.percent,
        amount,
        paidAmount: 0,
        balanceAmount: amount,
        dueDate,
        status: "pending",
        displayOrder: index,
        metadata: item.notes ? { notes: item.notes } : {},
      };
    },
  );

  return installments;
};

export const computeInstallmentStatus = (input: {
  amount: number;
  paidAmount: number;
  dueDate: string;
  asOfDate?: string;
  currentStatus?: FinanceInstallmentStatus;
}): FinanceInstallmentStatus => {
  if (input.currentStatus === "cancelled") {
    return "cancelled";
  }

  const amount = roundMoney(nonNegative(input.amount));
  const paidAmount = roundMoney(nonNegative(input.paidAmount));
  const balanceAmount = roundMoney(nonNegative(amount - paidAmount));

  if (balanceAmount <= EPSILON) {
    return "paid";
  }

  if (paidAmount > EPSILON) {
    return "partially_paid";
  }

  const asOf =
    toDateOnly(input.asOfDate) ?? new Date().toISOString().slice(0, 10);
  if (input.dueDate < asOf) {
    return "overdue";
  }

  return "pending";
};

export const computeInvoiceStatus = (input: {
  totalAmount: number;
  paidAmount: number;
  currentStatus?: FinanceInvoiceStatus;
  installments?: Array<
    Pick<FinanceInstallmentState, "dueDate" | "balanceAmount" | "status">
  >;
  asOfDate?: string;
}): FinanceInvoiceStatus => {
  if (input.currentStatus === "void" || input.currentStatus === "cancelled") {
    return input.currentStatus;
  }

  const totalAmount = roundMoney(nonNegative(input.totalAmount));
  const paidAmount = roundMoney(nonNegative(input.paidAmount));
  const balanceAmount = roundMoney(nonNegative(totalAmount - paidAmount));

  if (balanceAmount <= EPSILON) {
    return "paid";
  }

  const asOf =
    toDateOnly(input.asOfDate) ?? new Date().toISOString().slice(0, 10);
  const installments = Array.isArray(input.installments)
    ? input.installments
    : [];
  const hasOverdueInstallment = installments.some((installment) => {
    if (installment.balanceAmount <= EPSILON) {
      return false;
    }
    return installment.status === "overdue" || installment.dueDate < asOf;
  });

  if (hasOverdueInstallment) {
    return "overdue";
  }

  if (paidAmount > EPSILON) {
    return "partially_paid";
  }

  return input.currentStatus === "draft" ? "draft" : "issued";
};

export const buildAutomaticAllocationPlan = (
  installments: FinanceInstallmentState[],
  amount: number,
) => {
  const remainingInstallments = [...installments]
    .filter((installment) => installment.balanceAmount > EPSILON)
    .sort(compareInstallments);
  let remaining = roundMoney(nonNegative(amount));
  const allocations: FinanceAppliedAllocation[] = [];

  for (const installment of remainingInstallments) {
    if (remaining <= EPSILON) {
      break;
    }

    const allocatable = Math.min(installment.balanceAmount, remaining);
    if (allocatable <= EPSILON) {
      continue;
    }

    allocations.push({
      installmentId: installment.id,
      amount: roundMoney(allocatable),
    });

    remaining = roundMoney(remaining - allocatable);
  }

  if (remaining > EPSILON) {
    allocations.push({
      installmentId: null,
      amount: remaining,
    });
  }

  return allocations;
};

export const applyPaymentAllocation = (input: {
  paymentAmount: number;
  invoiceTotalAmount: number;
  invoicePaidAmount: number;
  invoiceStatus?: FinanceInvoiceStatus;
  installments: FinanceInstallmentState[];
  allocations?: FinanceAllocationInput[] | null;
  asOfDate?: string;
}) => {
  const paymentAmount = roundMoney(nonNegative(input.paymentAmount));
  if (paymentAmount <= EPSILON) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const invoiceTotalAmount = roundMoney(nonNegative(input.invoiceTotalAmount));
  const invoicePaidAmount = roundMoney(nonNegative(input.invoicePaidAmount));
  const invoiceBalanceAmount = roundMoney(
    nonNegative(invoiceTotalAmount - invoicePaidAmount),
  );

  if (paymentAmount - invoiceBalanceAmount > EPSILON) {
    throw new Error("Payment amount cannot exceed invoice balance.");
  }

  const byId = new Map<string, FinanceInstallmentState>(
    input.installments.map((installment) => [
      installment.id,
      { ...installment, metadata: { ...installment.metadata } },
    ]),
  );

  const normalizedManualAllocations = Array.isArray(input.allocations)
    ? input.allocations.filter(
        (allocation) => roundMoney(allocation.amount) > 0,
      )
    : [];
  const workingAllocations =
    normalizedManualAllocations.length > 0
      ? normalizedManualAllocations.map((allocation) => ({
          installmentId: allocation.installmentId ?? null,
          amount: roundMoney(nonNegative(allocation.amount)),
        }))
      : buildAutomaticAllocationPlan([...byId.values()], paymentAmount);

  const appliedAllocations: FinanceAppliedAllocation[] = [];
  let allocatedTotal = 0;

  for (const allocation of workingAllocations) {
    if (allocation.amount <= EPSILON) {
      continue;
    }

    if (!allocation.installmentId) {
      allocatedTotal = roundMoney(allocatedTotal + allocation.amount);
      appliedAllocations.push({
        installmentId: null,
        amount: allocation.amount,
      });
      continue;
    }

    const installment = byId.get(allocation.installmentId);
    if (!installment) {
      throw new Error(
        `Installment ${allocation.installmentId} does not belong to the invoice.`,
      );
    }

    if (allocation.amount - installment.balanceAmount > EPSILON) {
      throw new Error(
        `Allocation exceeds remaining balance for installment ${installment.id}.`,
      );
    }

    installment.paidAmount = roundMoney(
      installment.paidAmount + allocation.amount,
    );
    installment.balanceAmount = roundMoney(
      nonNegative(installment.amount - installment.paidAmount),
    );
    installment.status = computeInstallmentStatus({
      amount: installment.amount,
      paidAmount: installment.paidAmount,
      dueDate: installment.dueDate,
      currentStatus: installment.status,
      asOfDate: input.asOfDate,
    });

    allocatedTotal = roundMoney(allocatedTotal + allocation.amount);
    appliedAllocations.push({
      installmentId: installment.id,
      amount: allocation.amount,
    });
  }

  if (allocatedTotal - paymentAmount > EPSILON) {
    throw new Error("Total allocations cannot exceed payment amount.");
  }

  if (paymentAmount - allocatedTotal > EPSILON) {
    const remainder = roundMoney(paymentAmount - allocatedTotal);
    const autoPlan = buildAutomaticAllocationPlan(
      [...byId.values()],
      remainder,
    );

    for (const allocation of autoPlan) {
      if (allocation.amount <= EPSILON) {
        continue;
      }

      if (!allocation.installmentId) {
        allocatedTotal = roundMoney(allocatedTotal + allocation.amount);
        appliedAllocations.push({
          installmentId: null,
          amount: allocation.amount,
        });
        continue;
      }

      const installment = byId.get(allocation.installmentId);
      if (!installment) {
        continue;
      }

      installment.paidAmount = roundMoney(
        installment.paidAmount + allocation.amount,
      );
      installment.balanceAmount = roundMoney(
        nonNegative(installment.amount - installment.paidAmount),
      );
      installment.status = computeInstallmentStatus({
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        dueDate: installment.dueDate,
        currentStatus: installment.status,
        asOfDate: input.asOfDate,
      });

      allocatedTotal = roundMoney(allocatedTotal + allocation.amount);
      appliedAllocations.push({
        installmentId: installment.id,
        amount: allocation.amount,
      });
    }
  }

  const normalizedInstallments = [...byId.values()].map((installment) => {
    const status = computeInstallmentStatus({
      amount: installment.amount,
      paidAmount: installment.paidAmount,
      dueDate: installment.dueDate,
      currentStatus: installment.status,
      asOfDate: input.asOfDate,
    });
    return {
      ...installment,
      status,
      paidAmount: roundMoney(nonNegative(installment.paidAmount)),
      balanceAmount: roundMoney(
        nonNegative(installment.amount - installment.paidAmount),
      ),
    };
  });

  const nextInvoicePaidAmount = roundMoney(invoicePaidAmount + paymentAmount);
  const nextInvoiceBalanceAmount = roundMoney(
    nonNegative(invoiceTotalAmount - nextInvoicePaidAmount),
  );
  const nextInvoiceStatus = computeInvoiceStatus({
    totalAmount: invoiceTotalAmount,
    paidAmount: nextInvoicePaidAmount,
    currentStatus: input.invoiceStatus,
    installments: normalizedInstallments,
    asOfDate: input.asOfDate,
  });

  return {
    installments: normalizedInstallments,
    invoicePaidAmount: nextInvoicePaidAmount,
    invoiceBalanceAmount: nextInvoiceBalanceAmount,
    invoiceStatus: nextInvoiceStatus,
    appliedAllocations,
    directInvoiceAllocation: roundMoney(
      appliedAllocations
        .filter((allocation) => allocation.installmentId === null)
        .reduce((sum, allocation) => sum + allocation.amount, 0),
    ),
  };
};

const resolveAgingBucket = (daysPastDue: number): FinanceArAgingBucket => {
  if (daysPastDue <= 0) {
    return "current";
  }
  if (daysPastDue <= 30) {
    return "1_30";
  }
  if (daysPastDue <= 60) {
    return "31_60";
  }
  if (daysPastDue <= 90) {
    return "61_90";
  }
  return "90_plus";
};

const daysBetween = (from: string, to: string) => {
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const buildArAgingReport = (input: {
  rows: FinanceArAgingInputRow[];
  asOfDate?: string;
}) => {
  const asOfDate =
    toDateOnly(input.asOfDate) ?? new Date().toISOString().slice(0, 10);
  const rows = (Array.isArray(input.rows) ? input.rows : [])
    .filter((row) => roundMoney(nonNegative(row.balanceAmount)) > EPSILON)
    .map((row) => {
      const dueDate = toDateOnly(row.dueDate) ?? asOfDate;
      const daysPastDue = daysBetween(dueDate, asOfDate);
      const bucket = resolveAgingBucket(daysPastDue);
      return {
        ...row,
        dueDate,
        balanceAmount: roundMoney(nonNegative(row.balanceAmount)),
        daysPastDue,
        bucket,
      } as FinanceArAgingOutputRow;
    })
    .sort((a, b) => b.daysPastDue - a.daysPastDue);

  const buckets: Record<
    FinanceArAgingBucket,
    { amount: number; count: number; byCurrency: Record<string, number> }
  > = {
    current: { amount: 0, count: 0, byCurrency: {} },
    "1_30": { amount: 0, count: 0, byCurrency: {} },
    "31_60": { amount: 0, count: 0, byCurrency: {} },
    "61_90": { amount: 0, count: 0, byCurrency: {} },
    "90_plus": { amount: 0, count: 0, byCurrency: {} },
  };

  const totalsByCurrency: Record<string, number> = {};
  let totalAmount = 0;

  for (const row of rows) {
    const bucket = buckets[row.bucket];
    bucket.amount = roundMoney(bucket.amount + row.balanceAmount);
    bucket.count += 1;
    bucket.byCurrency[row.currency] = roundMoney(
      (bucket.byCurrency[row.currency] ?? 0) + row.balanceAmount,
    );

    totalsByCurrency[row.currency] = roundMoney(
      (totalsByCurrency[row.currency] ?? 0) + row.balanceAmount,
    );
    totalAmount = roundMoney(totalAmount + row.balanceAmount);
  }

  return {
    asOfDate,
    totalAmount,
    totalsByCurrency,
    buckets,
    rows,
  };
};

const approvalRequiredAdjustmentTypes = new Set<FinanceCreditAdjustmentType>([
  "refund",
  "writeoff",
]);

export const creditAdjustmentRequiresApproval = (
  adjustmentType: FinanceCreditAdjustmentType,
) => approvalRequiredAdjustmentTypes.has(adjustmentType);

export const canAutoApproveCreditAdjustment = (input: {
  adjustmentType: FinanceCreditAdjustmentType;
  actorPermissions?: string[] | null;
}) => {
  if (!creditAdjustmentRequiresApproval(input.adjustmentType)) {
    return true;
  }

  const permissions = Array.isArray(input.actorPermissions)
    ? input.actorPermissions
    : [];

  return permissions.includes("finance.approvals");
};

export const resolveCreditAdjustmentWorkflow = (input: {
  adjustmentType: FinanceCreditAdjustmentType;
  actorPermissions?: string[] | null;
  requestedAutoApprove?: boolean;
}) => {
  const requiresApproval = creditAdjustmentRequiresApproval(
    input.adjustmentType,
  );
  const hasPrivilege = canAutoApproveCreditAdjustment({
    adjustmentType: input.adjustmentType,
    actorPermissions: input.actorPermissions,
  });
  const requestedAutoApprove = Boolean(input.requestedAutoApprove);
  const autoApproved =
    requestedAutoApprove && hasPrivilege && !requiresApproval;

  return {
    requiresApproval,
    hasPrivilege,
    autoApproved,
    nextStatus: autoApproved ? "approved" : "pending",
    requireAuditEvent: true,
  };
};
