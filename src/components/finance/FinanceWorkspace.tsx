"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { resolveFinanceCapabilities } from "@/lib/finance/capabilities";
import { humanizeFinanceLabel } from "@/lib/finance/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ComboBox, type ComboOption } from "@/components/ui/combobox";

type OperationsQuote = {
  id: string;
  quote_number: string;
  quote_date: string;
  patient_name: string;
  final_price_usd: number | null;
  created_at: string;
};

type CurrencyCode = "USD" | "EGP" | "EUR" | "GBP" | "SAR" | "AED";

type ExchangeRatesPayload = {
  source: string;
  url: string;
  fetchedAt: string;
  asOf: string | null;
  rates: Array<{
    code: string;
    name: string;
    usdToCurrency: number;
  }>;
};

type FinanceInvoiceListItem = {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  patient_name: string | null;
  installments_count: number;
  overdue_installments_count: number;
  next_due_installment?: {
    id: string;
    label: string;
    due_date: string | null;
    balance_amount: number;
    status: string;
  } | null;
};

type FinanceInstallmentRow = {
  id: string;
  label: string;
  percent: number;
  amount: number;
  paid_amount: number;
  balance_amount: number;
  due_date: string;
  status: string;
  display_order: number;
};

type FinanceInvoiceInstallmentsResponse = {
  invoice: FinanceInvoiceListItem;
  installments: FinanceInstallmentRow[];
};

type FinanceAgingReport = {
  asOfDate: string;
  totalAmount: number;
  totalsByCurrency: Record<string, number>;
  buckets: Record<
    "current" | "1_30" | "31_60" | "61_90" | "90_plus",
    { amount: number; count: number; byCurrency: Record<string, number> }
  >;
  rows: Array<{
    invoiceId: string;
    invoiceNumber?: string | null;
    installmentId?: string | null;
    installmentLabel?: string | null;
    dueDate: string;
    balanceAmount: number;
    currency: string;
    daysPastDue: number;
    bucket: "current" | "1_30" | "31_60" | "61_90" | "90_plus";
  }>;
};

type FinanceCreditAdjustment = {
  id: string;
  finance_invoice_id: string | null;
  adjustment_type: "refund" | "writeoff" | "credit_note";
  amount: number;
  currency: string;
  reason_code: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  approval_request?: {
    id: string;
    status: string;
    decision_notes: string | null;
    decided_at: string | null;
  } | null;
};

type FinancePayableListItem = {
  id: string;
  payable_number: string;
  status: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  currency: string;
  has_pending_approval: boolean;
};

type FinanceApprovalRequest = {
  id: string;
  status: string;
};

type FinanceProfitLossReport = {
  baseCurrency: string;
  netIncome: number;
};

type InstallmentEditorRow = {
  label: string;
  percent: string;
  dueDate: string;
  notes: string;
};

const INVOICES_QUERY_KEY = ["finance", "invoices"] as const;
const QUOTES_QUERY_KEY = ["finance", "quotes", "operations"] as const;
const AGING_QUERY_KEY = ["finance", "ar-aging"] as const;
const CREDIT_ADJUSTMENTS_QUERY_KEY = ["finance", "credit-adjustments"] as const;
const FX_QUERY_KEY = ["finance", "quotation", "exchange-rates"] as const;
const PAYABLES_QUERY_KEY = ["finance", "payables"] as const;
const APPROVALS_QUERY_KEY = ["finance", "approval-requests"] as const;
const PROFIT_LOSS_QUERY_KEY = ["finance", "profit-loss"] as const;
const CONVERT_IN_PROGRESS_ERROR_MESSAGE =
  "Finance conversion already in progress for this quote";
const CONVERT_CONFLICT_RETRY_DELAY_MS = 700;

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    parsed,
  );
};

const startOfUtcDay = (value: Date) =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );

const sumByCurrency = <T extends { currency?: string | null }>(
  rows: T[],
  getAmount: (row: T) => number,
  fallbackCurrency: string,
) => {
  const totals: Record<string, number> = {};

  for (const row of rows) {
    const currency = (row.currency || fallbackCurrency).toUpperCase();
    const amount = Number(getAmount(row));
    if (!Number.isFinite(amount)) {
      continue;
    }
    totals[currency] = (totals[currency] ?? 0) + amount;
  }

  return totals;
};

const formatCurrencyBreakdown = (
  totalsByCurrency: Record<string, number> | null | undefined,
) => {
  const entries = Object.entries(totalsByCurrency ?? {})
    .map(([currency, amount]) => [currency, Number(amount)] as const)
    .filter(([, amount]) => Number.isFinite(amount) && Math.abs(amount) > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return formatCurrency(0, "USD");
  }

  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" | ");
};

const normalizePercent = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "0";
  }
  return parsed.toString();
};

const isConvertInProgressError = (error: unknown) =>
  error instanceof Error &&
  error.message.includes(CONVERT_IN_PROGRESS_ERROR_MESSAGE);

const statusBadgeVariant = (status?: string | null) => {
  switch (status) {
    case "paid":
    case "approved":
      return "success" as const;
    case "overdue":
    case "rejected":
      return "destructive" as const;
    case "partially_paid":
    case "pending":
      return "secondary" as const;
    case "cancelled":
    case "void":
      return "outline" as const;
    default:
      return "default" as const;
  }
};

type FinanceWorkspaceProps = {
  invoiceDetailsBasePath: string;
};

export function FinanceWorkspace({
  invoiceDetailsBasePath,
}: FinanceWorkspaceProps) {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();
  const { profile } = useUserProfile();
  const capabilities = useMemo(
    () => resolveFinanceCapabilities(profile?.permissions, profile?.roles),
    [profile?.permissions, profile?.roles],
  );
  const canViewInvoices = capabilities.canManageInvoices;
  const canViewQuotationData = capabilities.canAccessQuotationData;
  const canConvertQuotesCapability = capabilities.canConvertQuotes;
  const canRecordPaymentsCapability = capabilities.canRecordPayments;
  const canViewCreditAdjustments = capabilities.canRecordPayments;
  const canCreateCreditAdjustments = capabilities.canRecordPayments;
  const canDecideApprovals = capabilities.canDecideApprovals;
  const canViewPayables = capabilities.canManagePayables;
  const canViewApprovalsQueue = capabilities.canViewApprovalsQueue;
  const canViewReports = capabilities.canViewReports;
  const canViewApprovalsConsole = capabilities.canViewApprovalsConsole;
  const canViewSettingsConsole = capabilities.canViewSettingsConsole;

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [convertIssueDate, setConvertIssueDate] =
    useState<string>(todayDateOnly());
  const [convertDueDate, setConvertDueDate] = useState<string>("");
  const [convertCurrency, setConvertCurrency] = useState<CurrencyCode>("USD");
  const [convertStatus, setConvertStatus] = useState<"draft" | "issued">(
    "draft",
  );

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "cash" | "card" | "gateway"
  >("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const [installmentRows, setInstallmentRows] = useState<
    InstallmentEditorRow[]
  >([]);

  const [adjustmentType, setAdjustmentType] = useState<
    "refund" | "writeoff" | "credit_note"
  >("refund");
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [adjustmentReasonCode, setAdjustmentReasonCode] = useState<string>("");
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [adjustmentAutoApprove, setAdjustmentAutoApprove] =
    useState<boolean>(false);

  const invoicesQuery = useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceInvoiceListItem[]>("/api/admin/finance/invoices"),
    enabled: canViewInvoices,
    staleTime: 30_000,
  });

  const quotesQuery = useQuery({
    queryKey: QUOTES_QUERY_KEY,
    queryFn: () =>
      adminFetch<OperationsQuote[]>("/api/admin/finance/quotation/quotes"),
    enabled: canViewQuotationData,
    staleTime: 30_000,
  });

  const fxQuery = useQuery({
    queryKey: FX_QUERY_KEY,
    queryFn: () =>
      adminFetch<ExchangeRatesPayload>(
        "/api/admin/finance/quotation/exchange-rates",
      ),
    enabled: canViewQuotationData,
    staleTime: 5 * 60 * 1000,
  });

  const agingQuery = useQuery({
    queryKey: AGING_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceAgingReport>("/api/admin/finance/reports/ar-aging"),
    enabled: canViewReports,
    staleTime: 30_000,
  });

  const pendingAdjustmentsQuery = useQuery({
    queryKey: CREDIT_ADJUSTMENTS_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceCreditAdjustment[]>(
        "/api/admin/finance/credit-adjustments?status=pending",
      ),
    enabled: canViewCreditAdjustments,
    staleTime: 30_000,
  });

  const payablesQuery = useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinancePayableListItem[]>("/api/admin/finance/payables"),
    enabled: canViewPayables,
    staleTime: 30_000,
  });

  const approvalsQuery = useQuery({
    queryKey: APPROVALS_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceApprovalRequest[]>(
        "/api/admin/finance/approval-requests?status=pending",
      ),
    enabled: canViewApprovalsQueue,
    staleTime: 30_000,
  });

  const profitLossQuery = useQuery({
    queryKey: PROFIT_LOSS_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceProfitLossReport>(
        "/api/admin/finance/reports/profit-loss",
      ),
    enabled: canViewReports,
    staleTime: 30_000,
  });

  const selectedInvoice = useMemo(
    () =>
      (invoicesQuery.data ?? []).find(
        (invoice) => invoice.id === selectedInvoiceId,
      ) ?? null,
    [invoicesQuery.data, selectedInvoiceId],
  );
  const invoiceOptions = useMemo<ComboOption[]>(
    () =>
      (invoicesQuery.data ?? []).map((invoice) => ({
        value: invoice.id,
        label: `${invoice.invoice_number} - ${formatCurrency(invoice.balance_amount, invoice.currency)}`,
        description: invoice.patient_name
          ? `${invoice.patient_name} • ${humanizeFinanceLabel(invoice.status)}`
          : humanizeFinanceLabel(invoice.status),
      })),
    [invoicesQuery.data],
  );

  const selectedQuote = useMemo(
    () =>
      (quotesQuery.data ?? []).find((quote) => quote.id === selectedQuoteId) ??
      null,
    [quotesQuery.data, selectedQuoteId],
  );
  const quoteOptions = useMemo<ComboOption[]>(
    () =>
      (quotesQuery.data ?? []).map((quote) => ({
        value: quote.id,
        label: `${quote.quote_number} - ${quote.patient_name || "Patient"} (${formatDate(quote.quote_date)})`,
        description: Number.isFinite(quote.final_price_usd)
          ? `Total ${formatCurrency(Number(quote.final_price_usd), "USD")}`
          : undefined,
      })),
    [quotesQuery.data],
  );

  const usdToSelectedCurrencyRate = useMemo(() => {
    if (convertCurrency === "USD") {
      return 1;
    }
    const rate = fxQuery.data?.rates?.find(
      (item) => item.code === convertCurrency,
    );
    const value = rate?.usdToCurrency;
    return Number.isFinite(value) && typeof value === "number" && value > 0
      ? value
      : null;
  }, [convertCurrency, fxQuery.data?.rates]);

  const selectedQuoteTotalUsd = useMemo(
    () =>
      Number.isFinite(selectedQuote?.final_price_usd)
        ? Number(selectedQuote?.final_price_usd)
        : 0,
    [selectedQuote?.final_price_usd],
  );

  useEffect(() => {
    if (!selectedInvoiceId && (invoicesQuery.data ?? []).length > 0) {
      setSelectedInvoiceId(invoicesQuery.data?.[0]?.id ?? "");
    }
  }, [invoicesQuery.data, selectedInvoiceId]);

  useEffect(() => {
    if (!selectedQuoteId && (quotesQuery.data ?? []).length > 0) {
      setSelectedQuoteId(quotesQuery.data?.[0]?.id ?? "");
    }
  }, [quotesQuery.data, selectedQuoteId]);

  const installmentsQuery = useQuery({
    queryKey: ["finance", "invoice-installments", selectedInvoiceId],
    enabled: canViewInvoices && selectedInvoiceId.length > 0,
    queryFn: () =>
      adminFetch<FinanceInvoiceInstallmentsResponse>(
        `/api/admin/finance/invoices/${selectedInvoiceId}/installments`,
      ),
  });

  useEffect(() => {
    const installments = installmentsQuery.data?.installments ?? [];
    if (installments.length === 0) {
      setInstallmentRows([]);
      return;
    }

    setInstallmentRows(
      installments.map((installment) => ({
        label: installment.label,
        percent: String(installment.percent ?? 0),
        dueDate: installment.due_date ?? "",
        notes: "",
      })),
    );
  }, [installmentsQuery.data?.installments]);

  const convertQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!canConvertQuotesCapability) {
        throw new Error(
          "Quote conversion requires finance.orders and finance.invoices permissions.",
        );
      }
      if (!selectedQuoteId) {
        throw new Error("Select a quote first.");
      }

      return adminFetch<{
        reused: boolean;
        invoice: { id: string; invoice_number: string };
      }>(`/api/admin/finance/quotes/${selectedQuoteId}/convert`, {
        method: "POST",
        body: JSON.stringify({
          issueDate: convertIssueDate || undefined,
          dueDate: convertDueDate || undefined,
          currency: convertCurrency || "USD",
          invoiceStatus: convertStatus,
        }),
      });
    },
    retry: (failureCount, error) =>
      failureCount < 1 && isConvertInProgressError(error),
    retryDelay: (attemptIndex, error) =>
      isConvertInProgressError(error)
        ? CONVERT_CONFLICT_RETRY_DELAY_MS
        : Math.min(1000 * 2 ** attemptIndex, 30_000),
    onSuccess: (result) => {
      invalidateFinance();
      setSelectedInvoiceId(result.invoice.id);
      toast({
        title: result.reused
          ? "Existing finance invoice reused"
          : "Quote converted to invoice",
        description: `Invoice ${result.invoice.invoice_number} is ready.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to convert quote",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!canRecordPaymentsCapability) {
        throw new Error("finance.payments permission is required.");
      }
      if (!selectedInvoiceId) {
        throw new Error("Select an invoice first.");
      }
      const amount = Number(paymentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
      }

      return adminFetch<{
        invoice: { invoice_number: string; balance_amount: number };
        ledgerPosted?: boolean;
        ledgerPostingError?: string | null;
      }>("/api/admin/finance/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount,
          paymentMethod,
          paymentReference: paymentReference || undefined,
          notes: paymentNotes || undefined,
          currency: selectedInvoice?.currency ?? "USD",
        }),
      });
    },
    onSuccess: (result) => {
      invalidateFinance();
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      toast({
        title: "Payment recorded",
        description: `Invoice balance is now ${formatCurrency(result.invoice.balance_amount, selectedInvoice?.currency ?? "USD")}.`,
      });

      if (result.ledgerPosted === false) {
        toast({
          title: "Ledger posting pending",
          description:
            result.ledgerPostingError ??
            "Payment was saved, but ledger posting did not complete.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to record payment",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInstallmentsMutation = useMutation({
    mutationFn: async () => {
      if (!canViewInvoices) {
        throw new Error("finance.invoices permission is required.");
      }
      if (!selectedInvoiceId) {
        throw new Error("Select an invoice first.");
      }
      if (installmentRows.length === 0) {
        throw new Error("Add at least one installment row.");
      }

      const payload = installmentRows.map((row) => ({
        label: row.label.trim(),
        percent: Number(row.percent),
        dueDate: row.dueDate || undefined,
        notes: row.notes || undefined,
      }));

      if (payload.some((row) => !row.label || !Number.isFinite(row.percent))) {
        throw new Error("Each installment needs a label and valid percent.");
      }

      return adminFetch<FinanceInvoiceInstallmentsResponse>(
        `/api/admin/finance/invoices/${selectedInvoiceId}/installments`,
        {
          method: "PUT",
          body: JSON.stringify({ installments: payload }),
        },
      );
    },
    onSuccess: () => {
      invalidateFinance();
      toast({
        title: "Installment schedule updated",
        description: "Invoice schedule was saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update installments",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async () => {
      if (!canCreateCreditAdjustments) {
        throw new Error("finance.payments permission is required.");
      }
      if (!selectedInvoiceId) {
        throw new Error("Select an invoice to create an adjustment.");
      }
      const amount = Number(adjustmentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid adjustment amount.");
      }
      if (!adjustmentReasonCode.trim()) {
        throw new Error("Reason code is required.");
      }

      return adminFetch<{
        adjustment: { id: string; status: string };
        requiresApproval: boolean;
        ledgerPosted: boolean | null;
        ledgerPostingError: string | null;
      }>("/api/admin/finance/credit-adjustments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          adjustmentType,
          amount,
          currency: selectedInvoice?.currency ?? "USD",
          reasonCode: adjustmentReasonCode.trim(),
          notes: adjustmentNotes || undefined,
          autoApprove: adjustmentAutoApprove,
        }),
      });
    },
    onSuccess: (result) => {
      invalidateFinance();
      setAdjustmentAmount("");
      setAdjustmentReasonCode("");
      setAdjustmentNotes("");
      setAdjustmentAutoApprove(false);
      toast({
        title: "Credit adjustment submitted",
        description: result.requiresApproval
          ? "Approval request has been queued."
          : `Adjustment status: ${humanizeFinanceLabel(result.adjustment.status)}.`,
      });

      if (result.ledgerPosted === false) {
        toast({
          title: "Ledger posting pending",
          description:
            result.ledgerPostingError ??
            "Credit adjustment was saved, but ledger posting did not complete.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create credit adjustment",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const decideAdjustmentMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "approved" | "rejected";
      decisionNotes?: string;
    }) => {
      if (!canDecideApprovals) {
        throw new Error("finance.approvals permission is required.");
      }
      return adminFetch<{
        ledgerPosted: boolean | null;
        ledgerPostingError: string | null;
      }>(`/api/admin/finance/credit-adjustments/${payload.id}/decision`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (result) => {
      invalidateFinance();
      toast({
        title: "Decision recorded",
        description: "Credit adjustment approval status has been updated.",
      });

      if (result.ledgerPosted === false) {
        toast({
          title: "Ledger posting pending",
          description:
            result.ledgerPostingError ??
            "Decision was saved, but ledger posting did not complete.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update decision",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const outstandingByCurrency = useMemo(
    () =>
      sumByCurrency(
        invoicesQuery.data ?? [],
        (invoice) => invoice.balance_amount ?? 0,
        "USD",
      ),
    [invoicesQuery.data],
  );

  const overdueInstallmentsCount = useMemo(
    () =>
      (invoicesQuery.data ?? []).reduce(
        (sum, invoice) => sum + (invoice.overdue_installments_count ?? 0),
        0,
      ),
    [invoicesQuery.data],
  );

  const openPayables = useMemo(
    () =>
      (payablesQuery.data ?? []).filter((payable) =>
        ["approved", "scheduled", "partially_paid"].includes(payable.status),
      ),
    [payablesQuery.data],
  );

  const openPayablesBalanceByCurrency = useMemo(
    () =>
      sumByCurrency(
        openPayables,
        (payable) => payable.balance_amount ?? 0,
        "EGP",
      ),
    [openPayables],
  );

  const dueThisWeekPayablesCount = useMemo(() => {
    const windowStart = startOfUtcDay(new Date());
    const windowEnd = new Date(windowStart);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 7);

    return openPayables.filter((payable) => {
      if (!payable.due_date) {
        return false;
      }
      const dueDate = new Date(`${payable.due_date}T00:00:00.000Z`);
      if (!Number.isFinite(dueDate.getTime())) {
        return false;
      }
      return dueDate >= windowStart && dueDate <= windowEnd;
    }).length;
  }, [openPayables]);

  const hasFinanceDataError =
    (canViewInvoices && invoicesQuery.isError) ||
    (canViewQuotationData && quotesQuery.isError) ||
    (canViewReports && agingQuery.isError) ||
    (canViewCreditAdjustments && pendingAdjustmentsQuery.isError) ||
    (canViewPayables && payablesQuery.isError) ||
    (canViewApprovalsQueue && approvalsQuery.isError) ||
    (canViewReports && profitLossQuery.isError);

  const requiresFxRate = convertCurrency !== "USD";
  const hasFxRate = usdToSelectedCurrencyRate !== null;
  const canConvertQuote = canConvertQuotesCapability && hasFxRate;

  const convertedPreviewAmount = useMemo(() => {
    if (usdToSelectedCurrencyRate === null) {
      return null;
    }
    return selectedQuoteTotalUsd * usdToSelectedCurrencyRate;
  }, [selectedQuoteTotalUsd, usdToSelectedCurrencyRate]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Finance Workspace
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Manage quote-to-invoice conversion, installment schedules, payment
          allocations, receivables aging, and credit-approval workflows.
        </p>
      </header>

      {hasFinanceDataError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed to load some finance data
            </CardTitle>
            <CardDescription>
              Refresh the page or retry after a moment.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Total invoices</CardDescription>
            <CardTitle>
              {canViewInvoices ? (invoicesQuery.data?.length ?? 0) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Outstanding receivables</CardDescription>
            <CardTitle>
              {canViewInvoices
                ? formatCurrencyBreakdown(outstandingByCurrency)
                : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Overdue installments</CardDescription>
            <CardTitle>
              {canViewInvoices ? overdueInstallmentsCount : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Pending approvals</CardDescription>
            <CardTitle>
              {canViewApprovalsQueue ? (approvalsQuery.data?.length ?? 0) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Open payables</CardDescription>
            <CardTitle>{canViewPayables ? openPayables.length : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Period net income</CardDescription>
            <CardTitle>
              {canViewReports
                ? formatCurrency(
                    profitLossQuery.data?.netIncome ?? 0,
                    profitLossQuery.data?.baseCurrency ?? "EGP",
                  )
                : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>AP open balance</CardDescription>
            <CardTitle>
              {canViewPayables
                ? formatCurrencyBreakdown(openPayablesBalanceByCurrency)
                : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>AP due this week</CardDescription>
            <CardTitle>
              {canViewPayables ? dueThisWeekPayablesCount : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Quick links</CardDescription>
            <div className="mt-1 flex flex-wrap gap-2">
              {canViewPayables ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`${invoiceDetailsBasePath}/payables`}>
                    Payables
                  </Link>
                </Button>
              ) : null}
              {canViewReports ? (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${invoiceDetailsBasePath}/ledger/journals`}>
                      Journals
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${invoiceDetailsBasePath}/reports/ap-aging`}>
                      AP Aging
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${invoiceDetailsBasePath}/reports/ar-aging`}>
                      AR Aging
                    </Link>
                  </Button>
                </>
              ) : null}
              {canViewApprovalsConsole ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`${invoiceDetailsBasePath}/approvals`}>
                    Approvals
                  </Link>
                </Button>
              ) : null}
              {canViewSettingsConsole ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`${invoiceDetailsBasePath}/settings`}>
                    Settings
                  </Link>
                </Button>
              ) : null}
              {!canViewPayables &&
              !canViewReports &&
              !canViewApprovalsConsole &&
              !canViewSettingsConsole ? (
                <p className="text-xs text-muted-foreground">
                  No quick links available for this role.
                </p>
              ) : null}
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                Quote to invoice conversion
              </CardTitle>
              <CardDescription>
                Convert saved operations quotes into finance orders/invoices
                with installment schedules.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {canViewQuotationData ? (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Quote</Label>
                    <ComboBox
                      value={selectedQuoteId}
                      options={quoteOptions}
                      placeholder="Select quote"
                      searchPlaceholder="Search quotes..."
                      emptyLabel="No quotes found."
                      disabled={quotesQuery.isLoading}
                      onChange={setSelectedQuoteId}
                      contentClassName="w-[min(640px,calc(100vw-4rem))] p-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue date</Label>
                    <Input
                      type="date"
                      value={convertIssueDate}
                      onChange={(event) =>
                        setConvertIssueDate(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due date (optional)</Label>
                    <Input
                      type="date"
                      value={convertDueDate}
                      onChange={(event) =>
                        setConvertDueDate(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={convertCurrency}
                      onValueChange={(value: CurrencyCode) =>
                        setConvertCurrency(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EGP">EGP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                    {requiresFxRate ? (
                      fxQuery.isLoading ? (
                        <p className="text-xs text-muted-foreground">
                          Loading Banque Misr USD/{convertCurrency} rate...
                        </p>
                      ) : hasFxRate ? (
                        <p className="text-xs text-muted-foreground">
                          Auto FX: 1 USD ={" "}
                          {usdToSelectedCurrencyRate.toFixed(4)}{" "}
                          {convertCurrency}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">
                          Unable to load USD/{convertCurrency} rate. Retry
                          shortly before converting.
                        </p>
                      )
                    ) : null}
                    {selectedQuote && convertedPreviewAmount !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Preview total:{" "}
                        {formatCurrency(selectedQuoteTotalUsd, "USD")}
                        {convertCurrency !== "USD"
                          ? ` -> ${formatCurrency(convertedPreviewAmount, convertCurrency)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Initial invoice status</Label>
                    <Select
                      value={convertStatus}
                      onValueChange={(value: "draft" | "issued") =>
                        setConvertStatus(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => convertQuoteMutation.mutate()}
                      disabled={
                        convertQuoteMutation.isPending ||
                        !selectedQuoteId ||
                        quotesQuery.isLoading ||
                        !canConvertQuote
                      }
                    >
                      {convertQuoteMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Convert quote
                    </Button>
                    {!canConvertQuotesCapability ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Quote conversion requires both finance.orders and
                        finance.invoices permissions.
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Quote conversion requires orders/invoices access.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Invoice installments
                </CardTitle>
                <CardDescription>
                  Review and adjust installment schedule before finalization.
                </CardDescription>
              </div>
              <ComboBox
                value={selectedInvoiceId}
                options={invoiceOptions}
                placeholder="Select invoice"
                searchPlaceholder="Search invoices..."
                emptyLabel="No invoices found."
                disabled={!canViewInvoices || invoicesQuery.isLoading}
                onChange={setSelectedInvoiceId}
                className="w-full md:w-72"
                contentClassName="w-[min(640px,calc(100vw-4rem))] p-0"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {!canViewInvoices ? (
                <p className="text-sm text-muted-foreground">
                  Invoice permissions are required to manage installment
                  schedules.
                </p>
              ) : (
                <>
                  {installmentsQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading installments...
                    </div>
                  ) : installmentRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Select an invoice to manage installment schedule.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {installmentRows.map((row, index) => (
                          <div
                            key={`${index}-${row.label}`}
                            className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-4"
                          >
                            <Input
                              placeholder="Label"
                              value={row.label}
                              onChange={(event) => {
                                setInstallmentRows((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, label: event.target.value }
                                      : item,
                                  ),
                                );
                              }}
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Percent"
                              value={row.percent}
                              onChange={(event) => {
                                setInstallmentRows((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          percent: normalizePercent(
                                            event.target.value,
                                          ),
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                            <Input
                              type="date"
                              value={row.dueDate}
                              onChange={(event) => {
                                setInstallmentRows((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, dueDate: event.target.value }
                                      : item,
                                  ),
                                );
                              }}
                            />
                            <div className="flex gap-2">
                              <Input
                                placeholder="Notes"
                                value={row.notes}
                                onChange={(event) => {
                                  setInstallmentRows((prev) =>
                                    prev.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, notes: event.target.value }
                                        : item,
                                    ),
                                  );
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setInstallmentRows((prev) =>
                                    prev.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  );
                                }}
                                disabled={installmentRows.length <= 1}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setInstallmentRows((prev) => [
                              ...prev,
                              {
                                label: `Installment ${prev.length + 1}`,
                                percent: "0",
                                dueDate: "",
                                notes: "",
                              },
                            ])
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add installment
                        </Button>
                        <Button
                          type="button"
                          onClick={() => updateInstallmentsMutation.mutate()}
                          disabled={updateInstallmentsMutation.isPending}
                        >
                          {updateInstallmentsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Save schedule
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record payment</CardTitle>
              <CardDescription>
                Partial payments are auto-allocated across open installments by
                due date.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {canRecordPaymentsCapability ? (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Invoice</Label>
                    <ComboBox
                      value={selectedInvoiceId}
                      options={invoiceOptions}
                      placeholder="Select invoice"
                      searchPlaceholder="Search invoices..."
                      emptyLabel="No invoices found."
                      disabled={!canViewInvoices || invoicesQuery.isLoading}
                      onChange={setSelectedInvoiceId}
                      contentClassName="w-[min(640px,calc(100vw-4rem))] p-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(
                        value: "bank_transfer" | "cash" | "card" | "gateway",
                      ) => setPaymentMethod(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          Bank transfer
                        </SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="gateway">Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference (optional)</Label>
                    <Input
                      value={paymentReference}
                      onChange={(event) =>
                        setPaymentReference(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => recordPaymentMutation.mutate()}
                      disabled={
                        recordPaymentMutation.isPending || !selectedInvoiceId
                      }
                    >
                      {recordPaymentMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      Record payment
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Payment recording is hidden for roles without finance.payments
                  permission.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AR aging</CardTitle>
                <CardDescription>
                  Installment-based receivables aging as of{" "}
                  {formatDate(agingQuery.data?.asOfDate)}.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => agingQuery.refetch()}
                disabled={!canViewReports || agingQuery.isFetching}
              >
                {agingQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canViewReports ? (
                <p className="text-sm text-muted-foreground">
                  AR aging visibility requires finance.reports permission.
                </p>
              ) : agingQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading AR aging...
                </div>
              ) : (
                <>
                  {(
                    [
                      ["Current", "current"],
                      ["1-30 days", "1_30"],
                      ["31-60 days", "31_60"],
                      ["61-90 days", "61_90"],
                      ["90+ days", "90_plus"],
                    ] as const
                  ).map(([label, key]) => {
                    const bucket = agingQuery.data?.buckets?.[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {bucket?.count ?? 0} installment
                            {(bucket?.count ?? 0) === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrencyBreakdown(bucket?.byCurrency ?? {})}
                        </p>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create credit adjustment</CardTitle>
              <CardDescription>
                Refund and write-off adjustments are queued for approval and
                fully audited.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canCreateCreditAdjustments ? (
                <>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={adjustmentType}
                      onValueChange={(
                        value: "refund" | "writeoff" | "credit_note",
                      ) => setAdjustmentType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="writeoff">Write-off</SelectItem>
                        <SelectItem value="credit_note">Credit note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustmentAmount}
                      onChange={(event) =>
                        setAdjustmentAmount(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason code</Label>
                    <Input
                      value={adjustmentReasonCode}
                      onChange={(event) =>
                        setAdjustmentReasonCode(event.target.value)
                      }
                      placeholder="e.g. patient_refund_policy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={adjustmentNotes}
                      onChange={(event) =>
                        setAdjustmentNotes(event.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                    <Label htmlFor="auto-approve" className="text-sm">
                      Request auto-approval
                    </Label>
                    <Switch
                      id="auto-approve"
                      checked={adjustmentAutoApprove}
                      onCheckedChange={setAdjustmentAutoApprove}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createAdjustmentMutation.mutate()}
                    disabled={
                      createAdjustmentMutation.isPending || !selectedInvoiceId
                    }
                  >
                    {createAdjustmentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ReceiptText className="mr-2 h-4 w-4" />
                    )}
                    Submit adjustment
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Credit adjustments require finance.payments permission.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending approvals</CardTitle>
              <CardDescription>
                Approve or reject high-risk finance adjustments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canViewCreditAdjustments ? (
                <p className="text-sm text-muted-foreground">
                  Pending credit adjustments are visible to payments-capable
                  roles.
                </p>
              ) : pendingAdjustmentsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading pending approvals...
                </div>
              ) : (pendingAdjustmentsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending adjustments.
                </p>
              ) : (
                (pendingAdjustmentsQuery.data ?? []).map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {adjustment.adjustment_type.replace("_", " ")} -{" "}
                          {formatCurrency(
                            adjustment.amount,
                            adjustment.currency,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adjustment.reason_code} •{" "}
                          {formatDate(adjustment.created_at)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(adjustment.status)}>
                        {humanizeFinanceLabel(adjustment.status)}
                      </Badge>
                    </div>
                    {canDecideApprovals ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            decideAdjustmentMutation.mutate({
                              id: adjustment.id,
                              status: "rejected",
                            })
                          }
                          disabled={decideAdjustmentMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            decideAdjustmentMutation.mutate({
                              id: adjustment.id,
                              status: "approved",
                            })
                          }
                          disabled={decideAdjustmentMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Read-only: finance.approvals permission is required to
                        decide requests.
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice register</CardTitle>
          <CardDescription>
            Latest finance invoices with installment indicators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canViewInvoices ? (
            <p className="text-sm text-muted-foreground">
              Invoice register visibility requires finance.invoices permission.
            </p>
          ) : (
            <>
              {invoicesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading invoices...
                </div>
              ) : (invoicesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No finance invoices created yet. Convert a quote to start.
                </p>
              ) : (
                (invoicesQuery.data ?? []).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-left transition hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.patient_name || "Unassigned patient"} •
                          Issued {formatDate(invoice.issue_date)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(invoice.status)}>
                        {humanizeFinanceLabel(invoice.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                      >
                        Manage in workspace
                      </Button>
                      <Button asChild size="sm">
                        <Link
                          href={`${invoiceDetailsBasePath}/invoices/${invoice.id}`}
                        >
                          Open details
                        </Link>
                      </Button>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                      <span>
                        Total:{" "}
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </span>
                      <span>
                        Paid:{" "}
                        {formatCurrency(invoice.paid_amount, invoice.currency)}
                      </span>
                      <span>
                        Balance:{" "}
                        {formatCurrency(
                          invoice.balance_amount,
                          invoice.currency,
                        )}
                      </span>
                      <span>
                        Overdue installments:{" "}
                        {invoice.overdue_installments_count ?? 0}
                      </span>
                    </div>
                    {invoice.next_due_installment ? (
                      <p className="text-xs text-muted-foreground">
                        Next due: {invoice.next_due_installment.label} on{" "}
                        {formatDate(invoice.next_due_installment.due_date)} (
                        {formatCurrency(
                          invoice.next_due_installment.balance_amount,
                          invoice.currency,
                        )}
                        )
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceWorkspace;
