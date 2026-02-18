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
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
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

const normalizePercent = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "0";
  }
  return parsed.toString();
};

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
  const invalidate = useAdminInvalidate();

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
    staleTime: 30_000,
  });

  const quotesQuery = useQuery({
    queryKey: QUOTES_QUERY_KEY,
    queryFn: () =>
      adminFetch<OperationsQuote[]>("/api/admin/finance/quotation/quotes"),
    staleTime: 30_000,
  });

  const fxQuery = useQuery({
    queryKey: FX_QUERY_KEY,
    queryFn: () =>
      adminFetch<ExchangeRatesPayload>(
        "/api/admin/finance/quotation/exchange-rates",
      ),
    staleTime: 5 * 60 * 1000,
  });

  const agingQuery = useQuery({
    queryKey: AGING_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceAgingReport>("/api/admin/finance/reports/ar-aging"),
    staleTime: 30_000,
  });

  const pendingAdjustmentsQuery = useQuery({
    queryKey: CREDIT_ADJUSTMENTS_QUERY_KEY,
    queryFn: () =>
      adminFetch<FinanceCreditAdjustment[]>(
        "/api/admin/finance/credit-adjustments?status=pending",
      ),
    staleTime: 30_000,
  });

  const selectedInvoice = useMemo(
    () =>
      (invoicesQuery.data ?? []).find(
        (invoice) => invoice.id === selectedInvoiceId,
      ) ?? null,
    [invoicesQuery.data, selectedInvoiceId],
  );

  const selectedQuote = useMemo(
    () =>
      (quotesQuery.data ?? []).find((quote) => quote.id === selectedQuoteId) ??
      null,
    [quotesQuery.data, selectedQuoteId],
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
    enabled: selectedInvoiceId.length > 0,
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
    onSuccess: (result) => {
      invalidate(INVOICES_QUERY_KEY);
      invalidate(AGING_QUERY_KEY);
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
      if (!selectedInvoiceId) {
        throw new Error("Select an invoice first.");
      }
      const amount = Number(paymentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
      }

      return adminFetch<{
        invoice: { invoice_number: string; balance_amount: number };
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
      invalidate(INVOICES_QUERY_KEY);
      invalidate(AGING_QUERY_KEY);
      invalidate(["finance", "invoice-installments", selectedInvoiceId]);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      toast({
        title: "Payment recorded",
        description: `Invoice balance is now ${formatCurrency(result.invoice.balance_amount, selectedInvoice?.currency ?? "USD")}.`,
      });
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
      invalidate(INVOICES_QUERY_KEY);
      invalidate(AGING_QUERY_KEY);
      invalidate(["finance", "invoice-installments", selectedInvoiceId]);
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
      invalidate(CREDIT_ADJUSTMENTS_QUERY_KEY);
      setAdjustmentAmount("");
      setAdjustmentReasonCode("");
      setAdjustmentNotes("");
      setAdjustmentAutoApprove(false);
      toast({
        title: "Credit adjustment submitted",
        description: result.requiresApproval
          ? "Approval request has been queued."
          : `Adjustment status: ${result.adjustment.status}.`,
      });
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
    }) =>
      adminFetch(
        `/api/admin/finance/credit-adjustments/${payload.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => {
      invalidate(CREDIT_ADJUSTMENTS_QUERY_KEY);
      toast({
        title: "Decision recorded",
        description: "Credit adjustment approval status has been updated.",
      });
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

  const outstandingAmount = useMemo(
    () =>
      (invoicesQuery.data ?? []).reduce(
        (sum, invoice) => sum + (invoice.balance_amount ?? 0),
        0,
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

  const hasFinanceDataError =
    invoicesQuery.isError ||
    quotesQuery.isError ||
    agingQuery.isError ||
    pendingAdjustmentsQuery.isError;

  const requiresFxRate = convertCurrency !== "USD";
  const hasFxRate = usdToSelectedCurrencyRate !== null;
  const canConvertQuote = hasFxRate;

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total invoices</CardDescription>
            <CardTitle>{invoicesQuery.data?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding receivables</CardDescription>
            <CardTitle>{formatCurrency(outstandingAmount, "USD")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue installments</CardDescription>
            <CardTitle>{overdueInstallmentsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending approvals</CardDescription>
            <CardTitle>{pendingAdjustmentsQuery.data?.length ?? 0}</CardTitle>
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
              <div className="space-y-2 md:col-span-2">
                <Label>Quote</Label>
                <Select
                  value={selectedQuoteId}
                  onValueChange={setSelectedQuoteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quote" />
                  </SelectTrigger>
                  <SelectContent>
                    {(quotesQuery.data ?? []).map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.quote_number} - {quote.patient_name || "Patient"}{" "}
                        ({formatDate(quote.quote_date)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={convertIssueDate}
                  onChange={(event) => setConvertIssueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input
                  type="date"
                  value={convertDueDate}
                  onChange={(event) => setConvertDueDate(event.target.value)}
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
                      Auto FX: 1 USD = {usdToSelectedCurrencyRate.toFixed(4)}{" "}
                      {convertCurrency}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive">
                      Unable to load USD/{convertCurrency} rate. Retry shortly
                      before converting.
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
              </div>
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
              <Select
                value={selectedInvoiceId}
                onValueChange={setSelectedInvoiceId}
              >
                <SelectTrigger className="w-full md:w-72">
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {(invoicesQuery.data ?? []).map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} -{" "}
                      {formatCurrency(invoice.balance_amount, invoice.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2 md:col-span-2">
                <Label>Invoice</Label>
                <Select
                  value={selectedInvoiceId}
                  onValueChange={setSelectedInvoiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {(invoicesQuery.data ?? []).map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} -{" "}
                        {formatCurrency(
                          invoice.balance_amount,
                          invoice.currency,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
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
                  onChange={(event) => setPaymentReference(event.target.value)}
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
                disabled={agingQuery.isFetching}
              >
                {agingQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {agingQuery.isLoading ? (
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
                          {formatCurrency(bucket?.amount ?? 0, "USD")}
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
                  onChange={(event) => setAdjustmentAmount(event.target.value)}
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
                  onChange={(event) => setAdjustmentNotes(event.target.value)}
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
              {pendingAdjustmentsQuery.isLoading ? (
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
                        {adjustment.status}
                      </Badge>
                    </div>
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
                      {invoice.patient_name || "Unassigned patient"} • Issued{" "}
                      {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(invoice.status)}>
                    {invoice.status}
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
                    {formatCurrency(invoice.balance_amount, invoice.currency)}
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
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceWorkspace;
