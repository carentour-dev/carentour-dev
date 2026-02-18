import { z } from "zod";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { fetchBanqueMisrRates } from "@/server/modules/exchangeRates/banqueMisr";
import {
  applyPaymentAllocation,
  buildArAgingReport,
  computeInstallmentStatus,
  computeInvoiceStatus,
  generateInstallmentSchedule,
  resolveCreditAdjustmentWorkflow,
  type FinanceCreditAdjustmentType,
  type FinanceInstallmentState,
  type FinanceInstallmentTemplateItem,
} from "./logic";

type FinanceActor = {
  userId: string;
  profileId?: string | null;
  permissions?: string[] | null;
};

const INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "cancelled",
] as const;
type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

const CREDIT_ADJUSTMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

const PAYMENT_METHODS = ["bank_transfer", "cash", "card", "gateway"] as const;
const FINANCE_CURRENCIES = ["USD", "EGP", "EUR", "GBP", "SAR", "AED"] as const;
type FinanceCurrency = (typeof FINANCE_CURRENCIES)[number];
const financeCurrencySchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(FINANCE_CURRENCIES),
);

const installmentTemplateItemSchema = z.object({
  label: z.string().min(1, "Installment label is required").max(120),
  percent: z.coerce.number().gt(0, "Installment percent must be positive"),
  dueDate: z.string().optional(),
  dueInDays: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const convertQuoteSchema = z.object({
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: financeCurrencySchema.optional(),
  invoiceStatus: z.enum(["draft", "issued"]).optional(),
  installmentTemplate: z.array(installmentTemplateItemSchema).optional(),
});

const replaceInstallmentsSchema = z.object({
  installments: z
    .array(installmentTemplateItemSchema)
    .min(1, "At least one installment is required"),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice id"),
  paymentReference: z.string().max(160).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("bank_transfer"),
  paymentDate: z.string().optional(),
  currency: z.string().min(3).max(10).default("USD"),
  amount: z.coerce.number().gt(0, "Payment amount must be greater than zero"),
  source: z.string().max(120).optional(),
  receivedFrom: z.string().max(180).optional(),
  notes: z.string().max(2000).optional(),
  allocations: z
    .array(
      z.object({
        installmentId: z.string().uuid().optional(),
        amount: z.coerce.number().gt(0),
      }),
    )
    .optional(),
});

const creditAdjustmentRequestSchema = z
  .object({
    invoiceId: z.string().uuid().optional(),
    paymentId: z.string().uuid().optional(),
    adjustmentType: z.enum(["refund", "writeoff", "credit_note"]),
    amount: z.coerce.number().gt(0, "Adjustment amount must be positive"),
    currency: z.string().min(3).max(10).default("USD"),
    reasonCode: z.string().min(1).max(120),
    notes: z.string().max(2000).optional(),
    autoApprove: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.invoiceId || value.paymentId), {
    message: "invoiceId or paymentId is required",
  });

const creditAdjustmentDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  decisionNotes: z.string().max(2000).optional(),
});

const creditAdjustmentStatusSchema = z.enum(CREDIT_ADJUSTMENT_STATUSES);

const getClient = () => getSupabaseAdmin() as any;

const uuidSchema = z.string().uuid();

const toDateOnly = (value?: string | null) => {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

const addDays = (dateOnly: string, days: number) => {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

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
  const nonNegative = parsed < 0 ? 0 : parsed;
  return Math.round(nonNegative * 100) / 100;
};

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const ensureActor = (actor?: FinanceActor) => {
  if (!actor?.userId) {
    throw new ApiError(401, "Operation requires an authenticated team member");
  }
  return actor;
};

const mapInstallmentsToState = (rows: any[]): FinanceInstallmentState[] =>
  (rows ?? []).map((installment) => ({
    id: installment.id,
    label: installment.label,
    percent: normalizeMoney(installment.percent),
    amount: normalizeMoney(installment.amount),
    paidAmount: normalizeMoney(installment.paid_amount),
    balanceAmount: normalizeMoney(installment.balance_amount),
    dueDate:
      toDateOnly(installment.due_date) ?? new Date().toISOString().slice(0, 10),
    status: installment.status,
    displayOrder:
      typeof installment.display_order === "number"
        ? installment.display_order
        : 0,
    metadata:
      installment.metadata && typeof installment.metadata === "object"
        ? installment.metadata
        : {},
  }));

const getQuoteTemplate = (
  quote: Record<string, any> | null | undefined,
): Array<Partial<FinanceInstallmentTemplateItem>> | undefined => {
  const meta = quote?.input_data?.meta;
  if (!meta || typeof meta !== "object") {
    return undefined;
  }
  const template = (meta as { installmentTemplate?: unknown })
    .installmentTemplate;
  return Array.isArray(template)
    ? (template as FinanceInstallmentTemplateItem[])
    : undefined;
};

type QuoteSummaryLine = {
  line_type: string;
  description: string;
  amount: number;
};

type QuoteSummary = {
  subtotal: number;
  tax: number;
  total: number;
  lines: QuoteSummaryLine[];
};

type FinanceExchangeRateContext = {
  sourceCurrency: FinanceCurrency;
  targetCurrency: FinanceCurrency;
  usdToTargetRate: number;
  source: string;
  url: string | null;
  asOf: string | null;
  fetchedAt: string | null;
};

const getQuoteSummary = (quote: Record<string, any>): QuoteSummary => {
  const summary = quote?.computed_data?.summary ?? {};

  const medical = normalizeMoney(summary.medicalProcedureCostUsd);
  const accommodation = normalizeMoney(summary.accommodationCostUsd);
  const transportation = normalizeMoney(summary.transportationCostUsd);
  const tourism = normalizeMoney(summary.tourismCostUsd);
  const indirect = normalizeMoney(summary.indirectCostPerPatientUsd);
  const subtotal = normalizeMoney(summary.subtotalUsd ?? quote.subtotal_usd);
  const profit = normalizeMoney(
    summary.profitAmountUsd ?? quote.profit_amount_usd,
  );
  const total = normalizeMoney(summary.finalPriceUsd ?? quote.final_price_usd);

  const lines = [
    {
      line_type: "medical",
      description:
        quote?.input_data?.medical?.procedureDisplayName ||
        quote?.input_data?.medical?.procedureName ||
        "Medical procedure services",
      amount: medical,
    },
    {
      line_type: "accommodation",
      description: "Accommodation and stay logistics",
      amount: accommodation,
    },
    {
      line_type: "transportation",
      description: "Transportation and transfers",
      amount: transportation,
    },
    {
      line_type: "tourism",
      description: "Tourism and extra activities",
      amount: tourism,
    },
    {
      line_type: "indirect",
      description: "Allocated indirect case costs",
      amount: indirect,
    },
    {
      line_type: "margin",
      description: "Service margin",
      amount: profit,
    },
  ].filter((line) => line.amount > 0);

  if (lines.length === 0 && total > 0) {
    lines.push({
      line_type: "case_total",
      description: "Case quotation total",
      amount: total,
    });
  }

  return {
    subtotal: subtotal > 0 ? subtotal : Math.max(total - profit, 0),
    tax: 0,
    total,
    lines,
  };
};

const resolveUsdToTargetRate = async (targetCurrency: FinanceCurrency) => {
  if (targetCurrency === "USD") {
    return {
      usdToTargetRate: 1,
      source: "Quote base (USD)",
      url: null,
      asOf: null,
      fetchedAt: null,
    };
  }

  const payload = await fetchBanqueMisrRates();
  const targetRate = payload.rates.find((rate) => rate.code === targetCurrency);
  const usdToTargetRate =
    targetRate && Number.isFinite(targetRate.usdToCurrency)
      ? Number(targetRate.usdToCurrency)
      : 0;

  if (usdToTargetRate <= 0) {
    throw new ApiError(
      502,
      `Unable to resolve USD/${targetCurrency} exchange rate`,
    );
  }

  return {
    usdToTargetRate,
    source: payload.source,
    url: payload.url ?? null,
    asOf: payload.asOf ?? null,
    fetchedAt: payload.fetchedAt ?? null,
  };
};

const convertBetweenCurrenciesFromUsdBase = (input: {
  amount: number;
  sourceCurrency: FinanceCurrency;
  targetCurrency: FinanceCurrency;
  usdToSourceRate: number;
  usdToTargetRate: number;
}) => {
  const amount = normalizeMoney(input.amount);
  if (input.sourceCurrency === input.targetCurrency) {
    return amount;
  }

  const sourceRate = Number(input.usdToSourceRate);
  const targetRate = Number(input.usdToTargetRate);
  if (!Number.isFinite(sourceRate) || sourceRate <= 0) {
    throw new ApiError(422, "Invalid source currency rate");
  }
  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    throw new ApiError(422, "Invalid target currency rate");
  }

  const amountInUsd =
    input.sourceCurrency === "USD"
      ? amount
      : normalizeMoney(amount / sourceRate);
  if (input.targetCurrency === "USD") {
    return normalizeMoney(amountInUsd);
  }

  return normalizeMoney(amountInUsd * targetRate);
};

const convertQuoteSummaryCurrency = (input: {
  summary: QuoteSummary;
  sourceCurrency: FinanceCurrency;
  targetCurrency: FinanceCurrency;
  usdToSourceRate: number;
  usdToTargetRate: number;
}): QuoteSummary => {
  if (input.sourceCurrency === input.targetCurrency) {
    return input.summary;
  }

  const convertAmount = (amount: number) =>
    convertBetweenCurrenciesFromUsdBase({
      amount,
      sourceCurrency: input.sourceCurrency,
      targetCurrency: input.targetCurrency,
      usdToSourceRate: input.usdToSourceRate,
      usdToTargetRate: input.usdToTargetRate,
    });

  return {
    subtotal: convertAmount(input.summary.subtotal),
    tax: convertAmount(input.summary.tax),
    total: convertAmount(input.summary.total),
    lines: input.summary.lines.map((line) => ({
      ...line,
      amount: convertAmount(line.amount),
    })),
  };
};

const upsertInstallments = async (input: {
  supabase: any;
  invoiceId: string;
  totalAmount: number;
  issueDate: string;
  template: Array<Partial<FinanceInstallmentTemplateItem>> | undefined;
}) => {
  const schedule = generateInstallmentSchedule({
    totalAmount: input.totalAmount,
    issueDate: input.issueDate,
    template: input.template,
  });

  const insertPayload = schedule.map((installment) => ({
    finance_invoice_id: input.invoiceId,
    label: installment.label,
    percent: installment.percent,
    amount: installment.amount,
    paid_amount: installment.paidAmount,
    balance_amount: installment.balanceAmount,
    due_date: installment.dueDate,
    status: installment.status,
    display_order: installment.displayOrder,
    metadata: installment.metadata ?? {},
  }));

  if (insertPayload.length === 0) {
    return [] as any[];
  }

  const { data, error } = await input.supabase
    .from("finance_invoice_installments")
    .insert(insertPayload)
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "Failed to create invoice installments",
      error.message,
    );
  }

  return data ?? [];
};

const writeFinanceAuditEvent = async (input: {
  supabase: any;
  entityType: string;
  entityId?: string | null;
  action: string;
  actor: FinanceActor;
  payload?: Record<string, unknown>;
}) => {
  const { error } = await input.supabase.from("finance_audit_events").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor_user_id: input.actor.userId,
    actor_profile_id: input.actor.profileId ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    throw new ApiError(
      500,
      "Failed to record finance audit event",
      error.message,
    );
  }
};

export const financeController = {
  async listInvoices() {
    const supabase = getClient();

    const { data: invoices, error: invoicesError } = await supabase
      .from("finance_invoices")
      .select("*")
      .order("issue_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (invoicesError) {
      throw new ApiError(
        500,
        "Failed to load finance invoices",
        invoicesError.message,
      );
    }

    const invoiceRows = invoices ?? [];
    if (invoiceRows.length === 0) {
      return [];
    }

    const invoiceIds = invoiceRows.map((invoice: any) => invoice.id);
    const patientIds = Array.from(
      new Set(
        invoiceRows
          .map((invoice: any) => invoice.patient_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const [installmentsResult, patientsResult] = await Promise.all([
      supabase
        .from("finance_invoice_installments")
        .select(
          "id, finance_invoice_id, label, due_date, amount, paid_amount, balance_amount, status, display_order",
        )
        .in("finance_invoice_id", invoiceIds)
        .order("display_order", { ascending: true }),
      patientIds.length > 0
        ? supabase.from("patients").select("id, full_name").in("id", patientIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (installmentsResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice installment summaries",
        installmentsResult.error.message,
      );
    }

    if (patientsResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice patient metadata",
        patientsResult.error.message,
      );
    }

    const patientNameById = new Map<string, string>();
    for (const patient of patientsResult.data ?? []) {
      patientNameById.set(patient.id, patient.full_name);
    }

    const installmentsByInvoice = new Map<string, any[]>();
    for (const installment of installmentsResult.data ?? []) {
      const key = installment.finance_invoice_id;
      const list = installmentsByInvoice.get(key) ?? [];
      list.push(installment);
      installmentsByInvoice.set(key, list);
    }

    const today = new Date().toISOString().slice(0, 10);

    return invoiceRows.map((invoice: any) => {
      const rows = installmentsByInvoice.get(invoice.id) ?? [];
      const pendingRows = rows.filter(
        (row) =>
          normalizeMoney(row.balance_amount) > 0.005 &&
          row.status !== "cancelled" &&
          row.status !== "paid",
      );
      const overdueRows = pendingRows.filter((row) => {
        const dueDate = toDateOnly(row.due_date) ?? today;
        return row.status === "overdue" || dueDate < today;
      });
      const nextDue = [...pendingRows]
        .sort((a, b) => {
          const aDate = toDateOnly(a.due_date) ?? today;
          const bDate = toDateOnly(b.due_date) ?? today;
          return aDate.localeCompare(bDate);
        })
        .find((row) => {
          const dueDate = toDateOnly(row.due_date) ?? today;
          return dueDate >= today;
        });
      const fallbackNextDue = nextDue ?? pendingRows[0] ?? null;

      return {
        ...invoice,
        patient_name: invoice.patient_id
          ? (patientNameById.get(invoice.patient_id) ?? null)
          : null,
        installments_count: rows.length,
        overdue_installments_count: overdueRows.length,
        next_due_installment: fallbackNextDue
          ? {
              id: fallbackNextDue.id,
              label: fallbackNextDue.label,
              due_date: toDateOnly(fallbackNextDue.due_date),
              balance_amount: normalizeMoney(fallbackNextDue.balance_amount),
              status: fallbackNextDue.status,
            }
          : null,
      };
    });
  },

  async getInvoiceDetail(invoiceId: unknown) {
    const id = uuidSchema.parse(invoiceId);
    const supabase = getClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(
        500,
        "Failed to load finance invoice",
        invoiceError.message,
      );
    }
    if (!invoice) {
      throw new ApiError(404, "Finance invoice not found");
    }

    const [
      installmentsResult,
      allocationsResult,
      adjustmentsResult,
      patientResult,
    ] = await Promise.all([
      supabase
        .from("finance_invoice_installments")
        .select("*")
        .eq("finance_invoice_id", id)
        .order("display_order", { ascending: true }),
      supabase
        .from("finance_payment_allocations")
        .select("*")
        .eq("finance_invoice_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("finance_credit_adjustments")
        .select("*")
        .eq("finance_invoice_id", id)
        .order("created_at", { ascending: false }),
      invoice.patient_id
        ? supabase
            .from("patients")
            .select("id, full_name")
            .eq("id", invoice.patient_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (installmentsResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice installments",
        installmentsResult.error.message,
      );
    }

    if (allocationsResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice payment allocations",
        allocationsResult.error.message,
      );
    }

    if (adjustmentsResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice credit adjustments",
        adjustmentsResult.error.message,
      );
    }

    if (patientResult.error) {
      throw new ApiError(
        500,
        "Failed to load invoice patient metadata",
        patientResult.error.message,
      );
    }

    const installments = installmentsResult.data ?? [];
    const allocations = allocationsResult.data ?? [];
    const adjustments = adjustmentsResult.data ?? [];

    const paymentIds = Array.from(
      new Set(
        allocations
          .map((allocation: any) => allocation.finance_payment_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const { data: payments, error: paymentsError } =
      paymentIds.length > 0
        ? await supabase
            .from("finance_payments")
            .select("*")
            .in("id", paymentIds)
            .order("payment_date", { ascending: true })
        : { data: [], error: null };

    if (paymentsError) {
      throw new ApiError(
        500,
        "Failed to load payment history",
        paymentsError.message,
      );
    }

    const paymentById = new Map<string, any>();
    for (const payment of payments ?? []) {
      paymentById.set(payment.id, payment);
    }

    const installmentLabelById = new Map<string, string>();
    for (const installment of installments) {
      installmentLabelById.set(installment.id, installment.label);
    }

    const groupedAllocations = new Map<string, any[]>();
    for (const allocation of allocations) {
      const key = allocation.finance_payment_id;
      const list = groupedAllocations.get(key) ?? [];
      list.push(allocation);
      groupedAllocations.set(key, list);
    }

    const paymentHistory = (payments ?? []).map((payment: any) => {
      const paymentAllocations = (groupedAllocations.get(payment.id) ?? []).map(
        (allocation: any) => ({
          ...allocation,
          installment_label: allocation.finance_invoice_installment_id
            ? (installmentLabelById.get(
                allocation.finance_invoice_installment_id,
              ) ?? null)
            : null,
        }),
      );
      const totalAllocated = paymentAllocations.reduce(
        (sum: number, allocation: any) =>
          sum + normalizeMoney(allocation.amount),
        0,
      );

      return {
        ...payment,
        allocations: paymentAllocations,
        total_allocated: normalizeMoney(totalAllocated),
        unallocated_amount: normalizeMoney(
          normalizeMoney(payment.amount) - normalizeMoney(totalAllocated),
        ),
      };
    });

    const allocationTimeline = allocations.map((allocation: any) => ({
      id: allocation.id,
      created_at: allocation.created_at,
      payment_id: allocation.finance_payment_id,
      payment_reference:
        paymentById.get(allocation.finance_payment_id)?.payment_reference ??
        null,
      payment_date:
        paymentById.get(allocation.finance_payment_id)?.payment_date ?? null,
      installment_id: allocation.finance_invoice_installment_id,
      installment_label: allocation.finance_invoice_installment_id
        ? (installmentLabelById.get(
            allocation.finance_invoice_installment_id,
          ) ?? null)
        : null,
      amount: normalizeMoney(allocation.amount),
      currency: allocation.currency ?? invoice.currency ?? "USD",
    }));

    return {
      invoice: {
        ...invoice,
        patient_name: patientResult.data?.full_name ?? null,
      },
      installments,
      payments: paymentHistory,
      allocationTimeline,
      creditAdjustments: adjustments,
    };
  },

  async listCreditAdjustments(status?: unknown) {
    const supabase = getClient();
    const parsedStatus =
      typeof status === "string" && status.trim().length > 0
        ? creditAdjustmentStatusSchema.parse(status.trim())
        : null;

    let adjustmentsQuery = supabase
      .from("finance_credit_adjustments")
      .select("*")
      .order("created_at", { ascending: false });

    if (parsedStatus) {
      adjustmentsQuery = adjustmentsQuery.eq("status", parsedStatus);
    }

    const { data: adjustments, error: adjustmentsError } =
      await adjustmentsQuery;

    if (adjustmentsError) {
      throw new ApiError(
        500,
        "Failed to load credit adjustments",
        adjustmentsError.message,
      );
    }

    const adjustmentRows = adjustments ?? [];
    if (adjustmentRows.length === 0) {
      return [];
    }

    const adjustmentIds = adjustmentRows.map((row: any) => row.id);
    const { data: approvalRequests, error: approvalsError } = await supabase
      .from("finance_approval_requests")
      .select("*")
      .eq("entity_type", "finance_credit_adjustment")
      .in("entity_id", adjustmentIds)
      .order("created_at", { ascending: false });

    if (approvalsError) {
      throw new ApiError(
        500,
        "Failed to load approval requests for credit adjustments",
        approvalsError.message,
      );
    }

    const approvalByEntityId = new Map<string, any>();
    for (const approval of approvalRequests ?? []) {
      if (!approvalByEntityId.has(approval.entity_id)) {
        approvalByEntityId.set(approval.entity_id, approval);
      }
    }

    return adjustmentRows.map((row: any) => ({
      ...row,
      approval_request: approvalByEntityId.get(row.id) ?? null,
    }));
  },

  async convertQuoteToInvoice(
    quoteId: unknown,
    payload?: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(quoteId);
    const options = convertQuoteSchema.parse(payload ?? {});
    const supabase = getClient();

    const { data: quote, error: quoteError } = await supabase
      .from("operations_quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (quoteError) {
      throw new ApiError(500, "Failed to load quote", quoteError.message);
    }
    if (!quote) {
      throw new ApiError(404, "Quote not found");
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("finance_orders")
      .select("*")
      .eq("operations_quote_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOrderError) {
      throw new ApiError(
        500,
        "Failed to verify existing finance order",
        existingOrderError.message,
      );
    }

    if (existingOrder?.id) {
      const { data: existingCase } = await supabase
        .from("finance_cases")
        .select("*")
        .eq("operations_quote_id", id)
        .maybeSingle();

      const { data: existingInvoice, error: existingInvoiceError } =
        await supabase
          .from("finance_invoices")
          .select("*")
          .eq("finance_order_id", existingOrder.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (existingInvoiceError) {
        throw new ApiError(
          500,
          "Failed to verify existing invoice",
          existingInvoiceError.message,
        );
      }

      if (existingInvoice) {
        const installmentsResult = await this.getInvoiceInstallments(
          existingInvoice.id,
        );
        return {
          reused: true,
          financeCase: existingCase ?? null,
          order: existingOrder,
          invoice: installmentsResult.invoice,
          installments: installmentsResult.installments,
        };
      }
    }

    const quoteDate =
      toDateOnly(quote.quote_date) ?? new Date().toISOString().slice(0, 10);
    const issueDate = toDateOnly(options.issueDate) ?? quoteDate;
    const sourceSummary = getQuoteSummary(quote);
    if (sourceSummary.total <= 0) {
      throw new ApiError(
        422,
        "Quote total must be greater than zero before conversion",
      );
    }

    const currency: FinanceCurrency = options.currency ?? "USD";
    const resolvedTargetRate = await resolveUsdToTargetRate(currency);
    const exchangeRateContext: FinanceExchangeRateContext = {
      sourceCurrency: "USD",
      targetCurrency: currency,
      usdToTargetRate: resolvedTargetRate.usdToTargetRate,
      source: resolvedTargetRate.source,
      url: resolvedTargetRate.url,
      asOf: resolvedTargetRate.asOf,
      fetchedAt: resolvedTargetRate.fetchedAt,
    };

    const summary = convertQuoteSummaryCurrency({
      summary: sourceSummary,
      sourceCurrency: exchangeRateContext.sourceCurrency,
      targetCurrency: exchangeRateContext.targetCurrency,
      usdToSourceRate: 1,
      usdToTargetRate: exchangeRateContext.usdToTargetRate,
    });

    const patientName = normalizeText(quote.patient_name);
    let patientId: string | null = null;

    if (patientName) {
      const { data: matchedPatient, error: patientLookupError } = await supabase
        .from("patients")
        .select("id")
        .eq("full_name", patientName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (patientLookupError) {
        throw new ApiError(
          500,
          "Failed to resolve patient for finance case",
          patientLookupError.message,
        );
      }

      patientId = matchedPatient?.id ?? null;
    }

    const { data: financeCaseSeed, error: financeCaseSeedError } =
      await supabase
        .from("finance_cases")
        .select("*")
        .eq("operations_quote_id", id)
        .maybeSingle();

    if (financeCaseSeedError) {
      throw new ApiError(
        500,
        "Failed to load finance case",
        financeCaseSeedError.message,
      );
    }

    let financeCase = financeCaseSeed;

    if (!financeCase) {
      const caseTitleParts = [
        patientName ?? "Patient case",
        normalizeText(quote.input_data?.medical?.procedureDisplayName) ??
          normalizeText(quote.input_data?.medical?.procedureName),
      ].filter((value): value is string => Boolean(value));
      const caseTitle =
        caseTitleParts.length > 0 ? caseTitleParts.join(" - ") : "Finance case";

      const { data: createdCase, error: createCaseError } = await supabase
        .from("finance_cases")
        .insert({
          case_code: normalizeText(quote.quote_number),
          title: caseTitle,
          patient_id: patientId,
          operations_quote_id: quote.id,
          status: "active",
          source: "operations_quote",
          created_by_profile_id: owner.profileId ?? null,
          metadata: {
            quote_number: quote.quote_number,
            client_type: quote.client_type,
            country: quote.country,
          },
        })
        .select("*")
        .single();

      if (createCaseError || !createdCase) {
        throw new ApiError(
          500,
          "Failed to create finance case",
          createCaseError?.message,
        );
      }

      financeCase = createdCase;
    }

    const { data: order, error: createOrderError } = await supabase
      .from("finance_orders")
      .insert({
        finance_case_id: financeCase.id,
        operations_quote_id: quote.id,
        status: "confirmed",
        order_date: issueDate,
        currency,
        subtotal_amount: summary.subtotal,
        tax_amount: summary.tax,
        total_amount: summary.total,
        quote_snapshot: {
          ...quote,
          finance_conversion: {
            source_currency: exchangeRateContext.sourceCurrency,
            target_currency: exchangeRateContext.targetCurrency,
            usd_to_currency_rate: exchangeRateContext.usdToTargetRate,
            source: exchangeRateContext.source,
            source_url: exchangeRateContext.url,
            source_as_of: exchangeRateContext.asOf,
            fetched_at: exchangeRateContext.fetchedAt,
          },
        },
        notes:
          currency !== "USD"
            ? `Created from quotation calculator (auto FX via ${exchangeRateContext.source})`
            : "Created from quotation calculator",
        created_by_profile_id: owner.profileId ?? null,
      })
      .select("*")
      .single();

    if (createOrderError || !order) {
      throw new ApiError(
        500,
        "Failed to create finance order",
        createOrderError?.message,
      );
    }

    const orderLinesPayload = summary.lines.map((line) => ({
      finance_order_id: order.id,
      line_type: line.line_type,
      description: line.description,
      quantity: 1,
      unit_amount: line.amount,
      line_total: line.amount,
      currency,
      source_key: "quote_summary",
      metadata: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
        source_currency: exchangeRateContext.sourceCurrency,
        target_currency: exchangeRateContext.targetCurrency,
        usd_to_currency_rate: exchangeRateContext.usdToTargetRate,
      },
    }));

    const { data: orderLines, error: orderLinesError } = await supabase
      .from("finance_order_lines")
      .insert(orderLinesPayload)
      .select("*");

    if (orderLinesError) {
      throw new ApiError(
        500,
        "Failed to create finance order lines",
        orderLinesError.message,
      );
    }

    const explicitDueDate = toDateOnly(options.dueDate);
    const dueDate = explicitDueDate ?? addDays(issueDate, 30);
    const initialStatus: InvoiceStatus = options.invoiceStatus ?? "draft";

    const { data: invoice, error: createInvoiceError } = await supabase
      .from("finance_invoices")
      .insert({
        finance_case_id: financeCase.id,
        finance_order_id: order.id,
        patient_id: financeCase.patient_id ?? patientId,
        status: initialStatus,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        subtotal_amount: summary.subtotal,
        tax_amount: summary.tax,
        total_amount: summary.total,
        paid_amount: 0,
        balance_amount: summary.total,
        quote_payment_terms: normalizeText(
          quote.input_data?.meta?.paymentTerms,
        ),
        notes:
          currency !== "USD"
            ? `Generated from operations quote conversion (auto FX via ${exchangeRateContext.source})`
            : "Generated from operations quote conversion",
        created_by_profile_id: owner.profileId ?? null,
      })
      .select("*")
      .single();

    if (createInvoiceError || !invoice) {
      throw new ApiError(
        500,
        "Failed to create finance invoice",
        createInvoiceError?.message,
      );
    }

    const invoiceLinesPayload = (orderLines ?? []).map((line: any) => ({
      finance_invoice_id: invoice.id,
      finance_order_line_id: line.id,
      description: line.description,
      quantity: line.quantity ?? 1,
      unit_amount: line.unit_amount ?? line.line_total ?? 0,
      line_total: line.line_total ?? 0,
      currency,
      metadata: line.metadata ?? {},
    }));

    if (invoiceLinesPayload.length > 0) {
      const { error: invoiceLinesError } = await supabase
        .from("finance_invoice_lines")
        .insert(invoiceLinesPayload);

      if (invoiceLinesError) {
        throw new ApiError(
          500,
          "Failed to create finance invoice lines",
          invoiceLinesError.message,
        );
      }
    }

    const templateFromQuote = getQuoteTemplate(quote);
    const installments = await upsertInstallments({
      supabase,
      invoiceId: invoice.id,
      totalAmount: summary.total,
      issueDate,
      template: options.installmentTemplate ?? templateFromQuote,
    });

    const latestDueDate = installments
      .map((installment: any) => toDateOnly(installment.due_date))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => b.localeCompare(a))[0];

    if (latestDueDate && latestDueDate !== dueDate) {
      const { error: invoiceDueDateError } = await supabase
        .from("finance_invoices")
        .update({ due_date: latestDueDate })
        .eq("id", invoice.id);

      if (invoiceDueDateError) {
        throw new ApiError(
          500,
          "Failed to synchronize invoice due date",
          invoiceDueDateError.message,
        );
      }
      invoice.due_date = latestDueDate;
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_invoice",
      entityId: invoice.id,
      action: "quote_converted_to_invoice",
      actor: owner,
      payload: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
        finance_case_id: financeCase.id,
        finance_order_id: order.id,
        finance_invoice_id: invoice.id,
        source_currency: exchangeRateContext.sourceCurrency,
        target_currency: exchangeRateContext.targetCurrency,
        usd_to_currency_rate: exchangeRateContext.usdToTargetRate,
        fx_source: exchangeRateContext.source,
      },
    });

    return {
      reused: false,
      financeCase,
      order,
      invoice,
      installments,
    };
  },

  async getInvoiceInstallments(invoiceId: unknown) {
    const id = uuidSchema.parse(invoiceId);
    const supabase = getClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(500, "Failed to load invoice", invoiceError.message);
    }
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    const { data: installments, error: installmentsError } = await supabase
      .from("finance_invoice_installments")
      .select("*")
      .eq("finance_invoice_id", id)
      .order("display_order", { ascending: true });

    if (installmentsError) {
      throw new ApiError(
        500,
        "Failed to load invoice installments",
        installmentsError.message,
      );
    }

    return {
      invoice,
      installments: installments ?? [],
    };
  },

  async replaceInvoiceInstallments(
    invoiceId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(invoiceId);
    const parsed = replaceInstallmentsSchema.parse(payload);
    const supabase = getClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(500, "Failed to load invoice", invoiceError.message);
    }
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    if (!["draft", "issued"].includes(invoice.status)) {
      throw new ApiError(
        409,
        "Installments can only be edited before invoice finalization",
      );
    }

    const { count: allocationsCount, error: allocationsCountError } =
      await supabase
        .from("finance_payment_allocations")
        .select("id", { count: "exact", head: true })
        .eq("finance_invoice_id", id);

    if (allocationsCountError) {
      throw new ApiError(
        500,
        "Failed to validate installment edit constraints",
        allocationsCountError.message,
      );
    }

    if ((allocationsCount ?? 0) > 0) {
      throw new ApiError(
        409,
        "Installments cannot be edited after payments are allocated",
      );
    }

    const { error: deleteInstallmentsError } = await supabase
      .from("finance_invoice_installments")
      .delete()
      .eq("finance_invoice_id", id);

    if (deleteInstallmentsError) {
      throw new ApiError(
        500,
        "Failed to clear existing installment schedule",
        deleteInstallmentsError.message,
      );
    }

    const issueDate =
      toDateOnly(invoice.issue_date) ?? new Date().toISOString().slice(0, 10);
    const installments = await upsertInstallments({
      supabase,
      invoiceId: id,
      totalAmount: normalizeMoney(invoice.total_amount),
      issueDate,
      template: parsed.installments,
    });

    const installmentState = mapInstallmentsToState(installments).map(
      (installment) => ({
        ...installment,
        status: computeInstallmentStatus({
          amount: installment.amount,
          paidAmount: installment.paidAmount,
          dueDate: installment.dueDate,
          currentStatus: installment.status,
        }),
      }),
    );

    const invoiceStatus = computeInvoiceStatus({
      totalAmount: normalizeMoney(invoice.total_amount),
      paidAmount: normalizeMoney(invoice.paid_amount),
      currentStatus: invoice.status,
      installments: installmentState,
    });
    const latestDueDate = installmentState
      .map((installment) => installment.dueDate)
      .sort((a, b) => b.localeCompare(a))[0];

    const { data: updatedInvoice, error: updateInvoiceError } = await supabase
      .from("finance_invoices")
      .update({
        due_date: latestDueDate ?? invoice.due_date,
        status: invoiceStatus,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateInvoiceError || !updatedInvoice) {
      throw new ApiError(
        500,
        "Failed to update invoice schedule metadata",
        updateInvoiceError?.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_invoice",
      entityId: id,
      action: "installments_replaced",
      actor: owner,
      payload: {
        installments_count: installmentState.length,
      },
    });

    return {
      invoice: updatedInvoice,
      installments: installments ?? [],
    };
  },

  async recordPayment(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = recordPaymentSchema.parse(payload);
    const supabase = getClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", parsed.invoiceId)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(500, "Failed to load invoice", invoiceError.message);
    }
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }
    if (["cancelled", "void"].includes(invoice.status)) {
      throw new ApiError(
        409,
        "Cannot record payment for void/cancelled invoice",
      );
    }

    const { data: installmentRows, error: installmentsError } = await supabase
      .from("finance_invoice_installments")
      .select("*")
      .eq("finance_invoice_id", parsed.invoiceId)
      .order("display_order", { ascending: true });

    if (installmentsError) {
      throw new ApiError(
        500,
        "Failed to load invoice installments",
        installmentsError.message,
      );
    }

    const installmentState = mapInstallmentsToState(installmentRows ?? []);

    const allocationResult = applyPaymentAllocation({
      paymentAmount: parsed.amount,
      invoiceTotalAmount: normalizeMoney(invoice.total_amount),
      invoicePaidAmount: normalizeMoney(invoice.paid_amount),
      invoiceStatus: invoice.status,
      installments: installmentState,
      allocations: parsed.allocations?.map((allocation) => ({
        installmentId: allocation.installmentId ?? null,
        amount: allocation.amount,
      })),
    });

    const paymentDateCandidate = parsed.paymentDate
      ? new Date(parsed.paymentDate)
      : new Date();

    if (!Number.isFinite(paymentDateCandidate.getTime())) {
      throw new ApiError(422, "Invalid paymentDate format");
    }

    const paymentDate = paymentDateCandidate.toISOString();

    const { data: payment, error: paymentError } = await supabase
      .from("finance_payments")
      .insert({
        payment_reference: normalizeText(parsed.paymentReference),
        status: "recorded",
        payment_method: parsed.paymentMethod,
        payment_date: paymentDate,
        currency: parsed.currency.toUpperCase(),
        amount: parsed.amount,
        source: normalizeText(parsed.source),
        received_from: normalizeText(parsed.receivedFrom),
        notes: normalizeText(parsed.notes),
        created_by_profile_id: owner.profileId ?? null,
      })
      .select("*")
      .single();

    if (paymentError || !payment) {
      throw new ApiError(
        500,
        "Failed to record payment",
        paymentError?.message,
      );
    }

    const allocationRows = allocationResult.appliedAllocations.map(
      (allocation) => ({
        finance_payment_id: payment.id,
        finance_invoice_id: parsed.invoiceId,
        finance_invoice_installment_id: allocation.installmentId,
        amount: allocation.amount,
        currency: parsed.currency.toUpperCase(),
      }),
    );

    if (allocationRows.length > 0) {
      const { error: allocationInsertError } = await supabase
        .from("finance_payment_allocations")
        .insert(allocationRows);

      if (allocationInsertError) {
        throw new ApiError(
          500,
          "Failed to store payment allocations",
          allocationInsertError.message,
        );
      }
    }

    for (const installment of allocationResult.installments) {
      const { error: installmentUpdateError } = await supabase
        .from("finance_invoice_installments")
        .update({
          paid_amount: installment.paidAmount,
          balance_amount: installment.balanceAmount,
          status: installment.status,
        })
        .eq("id", installment.id);

      if (installmentUpdateError) {
        throw new ApiError(
          500,
          "Failed to update installment payment status",
          installmentUpdateError.message,
        );
      }
    }

    const { data: updatedInvoice, error: invoiceUpdateError } = await supabase
      .from("finance_invoices")
      .update({
        paid_amount: allocationResult.invoicePaidAmount,
        balance_amount: allocationResult.invoiceBalanceAmount,
        status: allocationResult.invoiceStatus,
      })
      .eq("id", parsed.invoiceId)
      .select("*")
      .single();

    if (invoiceUpdateError || !updatedInvoice) {
      throw new ApiError(
        500,
        "Failed to update invoice payment status",
        invoiceUpdateError?.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payment",
      entityId: payment.id,
      action: "payment_recorded",
      actor: owner,
      payload: {
        finance_invoice_id: parsed.invoiceId,
        finance_payment_id: payment.id,
        amount: parsed.amount,
        allocations: allocationResult.appliedAllocations,
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
      allocations: allocationResult.appliedAllocations,
      installments: allocationResult.installments,
    };
  },

  async listPatientInstallments(userId: unknown) {
    const patientUserId = z.string().uuid().parse(userId);
    const supabase = getClient();

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", patientUserId)
      .maybeSingle();

    if (patientError) {
      throw new ApiError(
        500,
        "Failed to resolve patient profile",
        patientError.message,
      );
    }

    if (!patient?.id) {
      return { patientId: null, invoices: [] };
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("patient_id", patient.id)
      .order("issue_date", { ascending: false });

    if (invoicesError) {
      throw new ApiError(
        500,
        "Failed to load patient invoices",
        invoicesError.message,
      );
    }

    const invoiceIds = (invoices ?? []).map((invoice: any) => invoice.id);
    if (invoiceIds.length === 0) {
      return { patientId: patient.id, invoices: [] };
    }

    const { data: installments, error: installmentsError } = await supabase
      .from("finance_invoice_installments")
      .select("*")
      .in("finance_invoice_id", invoiceIds)
      .order("display_order", { ascending: true });

    if (installmentsError) {
      throw new ApiError(
        500,
        "Failed to load patient installment schedules",
        installmentsError.message,
      );
    }

    const installmentMap = new Map<string, any[]>();
    for (const installment of installments ?? []) {
      const key = installment.finance_invoice_id;
      const list = installmentMap.get(key) ?? [];
      list.push(installment);
      installmentMap.set(key, list);
    }

    const today = new Date().toISOString().slice(0, 10);

    const outputInvoices = (invoices ?? []).map((invoice: any) => {
      const rows = mapInstallmentsToState(
        installmentMap.get(invoice.id) ?? [],
      ).map((installment) => ({
        ...installment,
        status: computeInstallmentStatus({
          amount: installment.amount,
          paidAmount: installment.paidAmount,
          dueDate: installment.dueDate,
          currentStatus: installment.status,
          asOfDate: today,
        }),
      }));

      const invoiceStatus = computeInvoiceStatus({
        totalAmount: normalizeMoney(invoice.total_amount),
        paidAmount: normalizeMoney(invoice.paid_amount),
        currentStatus: invoice.status,
        installments: rows,
        asOfDate: today,
      });

      return {
        ...invoice,
        computed_status: invoiceStatus,
        installments: rows.map((installment) => ({
          id: installment.id,
          label: installment.label,
          percent: installment.percent,
          amount: installment.amount,
          paid_amount: installment.paidAmount,
          balance_amount: installment.balanceAmount,
          due_date: installment.dueDate,
          status: installment.status,
          display_order: installment.displayOrder,
        })),
      };
    });

    return {
      patientId: patient.id,
      invoices: outputInvoices,
    };
  },

  async getArAgingReport(asOfDate?: string | null) {
    const supabase = getClient();
    const asOf =
      toDateOnly(asOfDate ?? undefined) ??
      new Date().toISOString().slice(0, 10);

    const { data: invoices, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select(
        "id, invoice_number, patient_id, due_date, balance_amount, currency, status",
      )
      .in("status", ["issued", "partially_paid", "overdue"])
      .gt("balance_amount", 0);

    if (invoiceError) {
      throw new ApiError(
        500,
        "Failed to load accounts receivable",
        invoiceError.message,
      );
    }

    const invoiceRows = invoices ?? [];
    if (invoiceRows.length === 0) {
      return buildArAgingReport({ rows: [], asOfDate: asOf });
    }

    const invoiceIds = invoiceRows.map((invoice: any) => invoice.id);

    const { data: installments, error: installmentError } = await supabase
      .from("finance_invoice_installments")
      .select("id, finance_invoice_id, label, due_date, balance_amount, status")
      .in("finance_invoice_id", invoiceIds)
      .gt("balance_amount", 0)
      .neq("status", "paid")
      .neq("status", "cancelled");

    if (installmentError) {
      throw new ApiError(
        500,
        "Failed to load installment aging details",
        installmentError.message,
      );
    }

    const installmentsByInvoice = new Map<string, any[]>();
    for (const installment of installments ?? []) {
      const key = installment.finance_invoice_id;
      const list = installmentsByInvoice.get(key) ?? [];
      list.push(installment);
      installmentsByInvoice.set(key, list);
    }

    const agingRows = [] as Array<{
      invoiceId: string;
      invoiceNumber?: string | null;
      patientId?: string | null;
      installmentId?: string | null;
      installmentLabel?: string | null;
      dueDate: string;
      balanceAmount: number;
      currency: string;
    }>;

    for (const invoice of invoiceRows) {
      const invoiceInstallments = installmentsByInvoice.get(invoice.id) ?? [];
      if (invoiceInstallments.length > 0) {
        for (const installment of invoiceInstallments) {
          agingRows.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            patientId: invoice.patient_id,
            installmentId: installment.id,
            installmentLabel: installment.label,
            dueDate: toDateOnly(installment.due_date) ?? asOf,
            balanceAmount: normalizeMoney(installment.balance_amount),
            currency: invoice.currency ?? "USD",
          });
        }
        continue;
      }

      agingRows.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        patientId: invoice.patient_id,
        installmentId: null,
        installmentLabel: null,
        dueDate: toDateOnly(invoice.due_date) ?? asOf,
        balanceAmount: normalizeMoney(invoice.balance_amount),
        currency: invoice.currency ?? "USD",
      });
    }

    return buildArAgingReport({
      rows: agingRows,
      asOfDate: asOf,
    });
  },

  async requestCreditAdjustment(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = creditAdjustmentRequestSchema.parse(payload);
    const supabase = getClient();

    const adjustmentType = parsed.adjustmentType as FinanceCreditAdjustmentType;
    const workflow = resolveCreditAdjustmentWorkflow({
      adjustmentType,
      actorPermissions: owner.permissions,
      requestedAutoApprove: parsed.autoApprove,
    });

    if (parsed.autoApprove && !workflow.hasPrivilege) {
      throw new ApiError(
        403,
        "finance.approvals permission is required to auto-approve this adjustment",
      );
    }

    const status = workflow.nextStatus;
    const nowIso = new Date().toISOString();

    const { data: adjustment, error: adjustmentError } = await supabase
      .from("finance_credit_adjustments")
      .insert({
        finance_invoice_id: parsed.invoiceId ?? null,
        finance_payment_id: parsed.paymentId ?? null,
        adjustment_type: adjustmentType,
        amount: normalizeMoney(parsed.amount),
        currency: parsed.currency.toUpperCase(),
        reason_code: parsed.reasonCode.trim(),
        notes: normalizeText(parsed.notes),
        status,
        requested_by_profile_id: owner.profileId ?? null,
        approved_by_profile_id:
          status === "approved" ? (owner.profileId ?? null) : null,
      })
      .select("*")
      .single();

    if (adjustmentError || !adjustment) {
      throw new ApiError(
        500,
        "Failed to create credit adjustment",
        adjustmentError?.message,
      );
    }

    const approvalStatus = status === "approved" ? "approved" : "pending";
    const approvalDecisionAt = status === "approved" ? nowIso : null;

    const { data: approvalRequest, error: approvalError } = await supabase
      .from("finance_approval_requests")
      .insert({
        entity_type: "finance_credit_adjustment",
        entity_id: adjustment.id,
        action: adjustmentType,
        status: approvalStatus,
        requested_by_profile_id: owner.profileId ?? null,
        approved_by_profile_id:
          status === "approved" ? (owner.profileId ?? null) : null,
        threshold_amount: normalizeMoney(parsed.amount),
        currency: parsed.currency.toUpperCase(),
        reason: parsed.reasonCode.trim(),
        decision_notes:
          status === "approved" ? "Auto-approved by privileged actor" : null,
        decided_at: approvalDecisionAt,
      })
      .select("*")
      .single();

    if (approvalError || !approvalRequest) {
      throw new ApiError(
        500,
        "Failed to create approval request",
        approvalError?.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_credit_adjustment",
      entityId: adjustment.id,
      action: "credit_adjustment_requested",
      actor: owner,
      payload: {
        adjustment_type: adjustmentType,
        amount: normalizeMoney(parsed.amount),
        currency: parsed.currency.toUpperCase(),
        requires_approval: workflow.requiresApproval,
        approval_request_id: approvalRequest.id,
      },
    });

    return {
      adjustment,
      approvalRequest,
      requiresApproval: workflow.requiresApproval,
    };
  },

  async decideCreditAdjustment(
    adjustmentId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    if (!(owner.permissions ?? []).includes("finance.approvals")) {
      throw new ApiError(403, "finance.approvals permission is required");
    }

    const id = uuidSchema.parse(adjustmentId);
    const parsed = creditAdjustmentDecisionSchema.parse(payload);
    const supabase = getClient();

    const { data: currentAdjustment, error: currentAdjustmentError } =
      await supabase
        .from("finance_credit_adjustments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (currentAdjustmentError) {
      throw new ApiError(
        500,
        "Failed to load credit adjustment",
        currentAdjustmentError.message,
      );
    }

    if (!currentAdjustment) {
      throw new ApiError(404, "Credit adjustment not found");
    }

    if (currentAdjustment.status !== "pending") {
      throw new ApiError(409, "Credit adjustment is not pending approval");
    }

    const { data: updatedAdjustment, error: updateAdjustmentError } =
      await supabase
        .from("finance_credit_adjustments")
        .update({
          status: parsed.status,
          approved_by_profile_id:
            parsed.status === "approved" ? (owner.profileId ?? null) : null,
          notes:
            parsed.decisionNotes && parsed.decisionNotes.trim().length > 0
              ? `${currentAdjustment.notes ?? ""}\nDecision: ${parsed.decisionNotes.trim()}`.trim()
              : currentAdjustment.notes,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateAdjustmentError || !updatedAdjustment) {
      throw new ApiError(
        500,
        "Failed to update credit adjustment decision",
        updateAdjustmentError?.message,
      );
    }

    const { error: updateApprovalError } = await supabase
      .from("finance_approval_requests")
      .update({
        status: parsed.status,
        approved_by_profile_id:
          parsed.status === "approved" ? (owner.profileId ?? null) : null,
        rejected_by_profile_id:
          parsed.status === "rejected" ? (owner.profileId ?? null) : null,
        decision_notes: normalizeText(parsed.decisionNotes),
        decided_at: new Date().toISOString(),
      })
      .eq("entity_type", "finance_credit_adjustment")
      .eq("entity_id", id)
      .eq("status", "pending");

    if (updateApprovalError) {
      throw new ApiError(
        500,
        "Failed to update approval request status",
        updateApprovalError.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_credit_adjustment",
      entityId: id,
      action:
        parsed.status === "approved"
          ? "credit_adjustment_approved"
          : "credit_adjustment_rejected",
      actor: owner,
      payload: {
        decision_notes: normalizeText(parsed.decisionNotes),
      },
    });

    return {
      adjustment: updatedAdjustment,
    };
  },
};
