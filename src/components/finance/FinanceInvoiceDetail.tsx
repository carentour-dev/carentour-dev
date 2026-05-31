"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  Loader2,
  PlusCircle,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  paymentLinks: Array<{
    id: string;
    finance_invoice_installment_id: string | null;
    label: string;
    amount: number;
    currency: string;
    url: string;
    status: "active" | "disabled" | "paid" | "expired";
    expires_at: string | null;
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

const INVOICE_LEVEL_LINK_VALUE = "invoice";

export function FinanceInvoiceDetail({
  workspacePath,
}: FinanceInvoiceDetailProps) {
  const params = useParams<{ id: string }>();
  const invoiceId = typeof params?.id === "string" ? params.id : "";
  const { toast } = useToast();
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    label: "",
    amount: "",
    url: "",
    installmentId: INVOICE_LEVEL_LINK_VALUE,
    expiresAt: "",
  });

  const detailQuery = useQuery({
    queryKey: ["finance", "invoice-detail", invoiceId],
    enabled: invoiceId.length > 0,
    queryFn: () =>
      adminFetch<InvoiceDetailResponse>(
        `/api/admin/finance/invoices/${invoiceId}`,
      ),
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) {
        throw new Error("Invoice id is missing.");
      }
      const amount = Number(paymentLinkForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a positive payment link amount.");
      }

      return adminFetch(
        `/api/admin/finance/invoices/${invoiceId}/payment-links`,
        {
          method: "POST",
          body: JSON.stringify({
            label: paymentLinkForm.label.trim() || "Stripe payment link",
            amount,
            url: paymentLinkForm.url.trim(),
            installmentId:
              paymentLinkForm.installmentId === INVOICE_LEVEL_LINK_VALUE
                ? null
                : paymentLinkForm.installmentId,
            expiresAt: paymentLinkForm.expiresAt
              ? new Date(paymentLinkForm.expiresAt).toISOString()
              : null,
          }),
        },
      );
    },
    onSuccess: async () => {
      setPaymentLinkForm({
        label: "",
        amount: "",
        url: "",
        installmentId: INVOICE_LEVEL_LINK_VALUE,
        expiresAt: "",
      });
      await detailQuery.refetch();
      toast({
        title: "Payment link added",
        description: "The patient can now see this link on their dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add payment link",
        description:
          error instanceof Error ? error.message : "Please check the link.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentLinkStatusMutation = useMutation({
    mutationFn: (input: {
      paymentLinkId: string;
      status: "active" | "disabled" | "paid" | "expired";
    }) =>
      adminFetch(`/api/admin/finance/payment-links/${input.paymentLinkId}`, {
        method: "PUT",
        body: JSON.stringify({ status: input.status }),
      }),
    onSuccess: async () => {
      await detailQuery.refetch();
      toast({
        title: "Payment link updated",
        description: "The dashboard visibility was updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payment link",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
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
    paymentLinks,
  } = detailQuery.data;

  const installmentLabelById = new Map(
    installments.map((installment) => [installment.id, installment.label]),
  );

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
          {humanizeFinanceLabel(invoice.status)}
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
            <Link2 className="h-5 w-5 text-primary" />
            Patient payment links
          </CardTitle>
          <CardDescription>
            Add manually generated Stripe links for the patient dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_1fr_auto]">
            <div className="space-y-1">
              <Label htmlFor="payment-link-label">Label</Label>
              <Input
                id="payment-link-label"
                value={paymentLinkForm.label}
                placeholder="Deposit payment"
                onChange={(event) =>
                  setPaymentLinkForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-link-url">Stripe URL</Label>
              <Input
                id="payment-link-url"
                value={paymentLinkForm.url}
                placeholder="https://buy.stripe.com/..."
                onChange={(event) =>
                  setPaymentLinkForm((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-link-amount">Amount</Label>
              <Input
                id="payment-link-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentLinkForm.amount}
                placeholder={String(invoice.balance_amount)}
                onChange={(event) =>
                  setPaymentLinkForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select
                value={paymentLinkForm.installmentId}
                onValueChange={(value) =>
                  setPaymentLinkForm((current) => ({
                    ...current,
                    installmentId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={INVOICE_LEVEL_LINK_VALUE}>
                    Invoice balance
                  </SelectItem>
                  {installments.map((installment) => (
                    <SelectItem key={installment.id} value={installment.id}>
                      {installment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => createPaymentLinkMutation.mutate()}
                disabled={createPaymentLinkMutation.isPending}
              >
                {createPaymentLinkMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Add link
              </Button>
            </div>
          </div>

          <div className="max-w-xs space-y-1">
            <Label htmlFor="payment-link-expires-at">Expires at</Label>
            <Input
              id="payment-link-expires-at"
              type="datetime-local"
              value={paymentLinkForm.expiresAt}
              onChange={(event) =>
                setPaymentLinkForm((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
            />
          </div>

          {paymentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment links have been added for this invoice.
            </p>
          ) : (
            <div className="space-y-2">
              {paymentLinks.map((paymentLink) => (
                <div
                  key={paymentLink.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {paymentLink.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {paymentLink.finance_invoice_installment_id
                          ? installmentLabelById.get(
                              paymentLink.finance_invoice_installment_id,
                            ) || "Installment"
                          : "Invoice balance"}{" "}
                        •{" "}
                        {formatCurrency(
                          paymentLink.amount,
                          paymentLink.currency,
                        )}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {paymentLink.url}
                      </p>
                      {paymentLink.expires_at ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {formatDateTime(paymentLink.expires_at)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={badgeVariant(paymentLink.status)}>
                        {humanizeFinanceLabel(paymentLink.status)}
                      </Badge>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={paymentLink.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </a>
                      </Button>
                      {paymentLink.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updatePaymentLinkStatusMutation.mutate({
                              paymentLinkId: paymentLink.id,
                              status: "disabled",
                            })
                          }
                          disabled={updatePaymentLinkStatusMutation.isPending}
                        >
                          Disable
                        </Button>
                      ) : paymentLink.status === "disabled" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updatePaymentLinkStatusMutation.mutate({
                              paymentLinkId: paymentLink.id,
                              status: "active",
                            })
                          }
                          disabled={updatePaymentLinkStatusMutation.isPending}
                        >
                          Activate
                        </Button>
                      ) : null}
                      {paymentLink.status !== "paid" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updatePaymentLinkStatusMutation.mutate({
                              paymentLinkId: paymentLink.id,
                              status: "paid",
                            })
                          }
                          disabled={updatePaymentLinkStatusMutation.isPending}
                        >
                          Mark paid
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {humanizeFinanceLabel(installment.status)}
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
                      {humanizeFinanceLabel(payment.payment_method)}
                    </p>
                  </div>
                  <Badge variant={badgeVariant(payment.status)}>
                    {humanizeFinanceLabel(payment.status)}
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
                      {humanizeFinanceLabel(adjustment.adjustment_type)} •{" "}
                      {formatCurrency(adjustment.amount, adjustment.currency)}
                    </p>
                    <Badge variant={badgeVariant(adjustment.status)}>
                      {humanizeFinanceLabel(adjustment.status)}
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
