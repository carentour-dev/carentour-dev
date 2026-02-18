"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvoiceDetailResponse = {
  invoice: {
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
    quote_payment_terms: string | null;
    notes: string | null;
  };
  installments: Array<{
    id: string;
    label: string;
    percent: number;
    amount: number;
    paid_amount: number;
    balance_amount: number;
    due_date: string;
    status: string;
    display_order: number;
  }>;
  payments: Array<{
    id: string;
    payment_reference: string | null;
    payment_method: string;
    payment_date: string;
    amount: number;
    currency: string;
    status: string;
    received_from: string | null;
    notes: string | null;
    total_allocated: number;
    unallocated_amount: number;
    allocations: Array<{
      id: string;
      finance_invoice_installment_id: string | null;
      installment_label: string | null;
      amount: number;
      currency: string;
      created_at: string;
    }>;
  }>;
  allocationTimeline: Array<{
    id: string;
    created_at: string;
    payment_id: string;
    payment_reference: string | null;
    payment_date: string | null;
    installment_id: string | null;
    installment_label: string | null;
    amount: number;
    currency: string;
  }>;
  creditAdjustments: Array<{
    id: string;
    adjustment_type: string;
    amount: number;
    currency: string;
    reason_code: string;
    status: string;
    notes: string | null;
    created_at: string;
  }>;
};

type FinanceInvoiceDetailProps = {
  workspacePath: string;
};

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const badgeVariant = (status?: string | null) => {
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

export function FinanceInvoiceDetail({
  workspacePath,
}: FinanceInvoiceDetailProps) {
  const params = useParams<{ id: string }>();
  const invoiceId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useQuery({
    queryKey: ["finance", "invoice-detail", invoiceId],
    enabled: invoiceId.length > 0,
    queryFn: () =>
      adminFetch<InvoiceDetailResponse>(
        `/api/admin/finance/invoices/${invoiceId}`,
      ),
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading invoice details...
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">
            Unable to load invoice
          </CardTitle>
          <CardDescription>
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Please refresh and try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={workspacePath}>Back to finance workspace</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    invoice,
    installments,
    payments,
    allocationTimeline,
    creditAdjustments,
  } = detailQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={workspacePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to finance workspace
          </Link>
        </Button>
        <Badge variant={badgeVariant(invoice.status)}>
          {invoice.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            {invoice.invoice_number}
          </CardTitle>
          <CardDescription>
            {invoice.patient_name || "Unassigned patient"} • Issued{" "}
            {formatDate(invoice.issue_date)} • Due{" "}
            {formatDate(invoice.due_date)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Paid
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(invoice.paid_amount, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Balance
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(invoice.balance_amount, invoice.currency)}
            </p>
          </div>
          {invoice.quote_payment_terms ? (
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Payment terms
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {invoice.quote_payment_terms}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Installment schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {installments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No installments found.
            </p>
          ) : (
            installments.map((installment) => (
              <div
                key={installment.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{installment.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(installment.due_date)} •{" "}
                      {installment.percent}%
                    </p>
                  </div>
                  <Badge variant={badgeVariant(installment.status)}>
                    {installment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                  <span>
                    Amount:{" "}
                    {formatCurrency(installment.amount, invoice.currency)}
                  </span>
                  <span>
                    Paid:{" "}
                    {formatCurrency(installment.paid_amount, invoice.currency)}
                  </span>
                  <span>
                    Balance:{" "}
                    {formatCurrency(
                      installment.balance_amount,
                      invoice.currency,
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Payment history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {payment.payment_reference ||
                        `Payment ${payment.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.payment_date)} •{" "}
                      {payment.payment_method.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant={badgeVariant(payment.status)}>
                    {payment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                  <span>
                    Amount: {formatCurrency(payment.amount, payment.currency)}
                  </span>
                  <span>
                    Allocated:{" "}
                    {formatCurrency(payment.total_allocated, payment.currency)}
                  </span>
                  <span>
                    Unallocated:{" "}
                    {formatCurrency(
                      payment.unallocated_amount,
                      payment.currency,
                    )}
                  </span>
                </div>
                {payment.allocations.length > 0 ? (
                  <div className="mt-2 space-y-1 rounded-md border border-border/60 bg-background/60 p-2">
                    {payment.allocations.map((allocation) => (
                      <p
                        key={allocation.id}
                        className="text-xs text-muted-foreground"
                      >
                        {allocation.installment_label ||
                          "Invoice-level allocation"}{" "}
                        •{" "}
                        {formatCurrency(allocation.amount, allocation.currency)}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Allocation timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allocationTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No allocation events recorded yet.
              </p>
            ) : (
              allocationTimeline.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.created_at)}
                  </p>
                  <p className="text-sm font-medium">
                    {event.installment_label || "Invoice-level allocation"} •{" "}
                    {formatCurrency(event.amount, event.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payment ref: {event.payment_reference || "N/A"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit adjustments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {creditAdjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No credit adjustments for this invoice.
              </p>
            ) : (
              creditAdjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      {adjustment.adjustment_type.replace(/_/g, " ")} •{" "}
                      {formatCurrency(adjustment.amount, adjustment.currency)}
                    </p>
                    <Badge variant={badgeVariant(adjustment.status)}>
                      {adjustment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {adjustment.reason_code} •{" "}
                    {formatDate(adjustment.created_at)}
                  </p>
                  {adjustment.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {adjustment.notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinanceInvoiceDetail;
