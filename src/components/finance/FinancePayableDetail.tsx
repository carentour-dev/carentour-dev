"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, Wallet, XCircle } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import { canRecordPayableSettlement } from "@/lib/finance/payablesState";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type FinancePayableDetailProps = {
  workspaceBasePath: string;
};

type PayableDetailResponse = {
  payable: {
    id: string;
    payable_number: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    currency: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    notes: string | null;
    counterparty_name: string | null;
    counterparty_kind: string | null;
  };
  lines: Array<{
    id: string;
    description: string;
    amount: number;
    finance_chart_account_id: string | null;
  }>;
  payments: Array<{
    id: string;
    payment_date: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    payment_group_id: string | null;
    reference: string | null;
    notes: string | null;
  }>;
  approvals: Array<{
    id: string;
    entity_type: string;
    status: string;
    action: string;
    reason: string | null;
    decided_at: string | null;
    created_at: string;
  }>;
};

const formatCurrency = (value: number, currency = "EGP") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    parsed,
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const statusBadgeVariant = (status?: string | null) => {
  switch (status) {
    case "paid":
    case "approved":
      return "success" as const;
    case "partially_paid":
    case "pending":
    case "scheduled":
      return "secondary" as const;
    case "cancelled":
    case "rejected":
      return "outline" as const;
    default:
      return "default" as const;
  }
};

export function FinancePayableDetail({
  workspaceBasePath,
}: FinancePayableDetailProps) {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();
  const params = useParams<{ id: string }>();
  const payableId = typeof params?.id === "string" ? params.id : "";

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "cash" | "card" | "gateway"
  >("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const detailQuery = useQuery({
    queryKey: ["finance", "payables", payableId],
    enabled: payableId.length > 0,
    queryFn: () =>
      adminFetch<PayableDetailResponse>(
        `/api/admin/finance/payables/${payableId}`,
      ),
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      adminFetch(`/api/admin/finance/payables/${payableId}/submit`, {
        method: "POST",
      }),
    onSuccess: () => {
      invalidateFinance();
      toast({
        title: "Payable submitted",
        description: "Approval workflow has been evaluated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit payable",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () =>
      adminFetch(`/api/admin/finance/payables/${payableId}/cancel`, {
        method: "POST",
      }),
    onSuccess: () => {
      invalidateFinance();
      toast({
        title: "Payable cancelled",
        description: "Payable status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel payable",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const currentPayable = detailQuery.data?.payable;
      if (!currentPayable) {
        throw new Error("Payable details are unavailable.");
      }
      if (
        !canRecordPayableSettlement(
          currentPayable.status,
          currentPayable.balance_amount,
        )
      ) {
        throw new Error(
          "Settlement is only available for approved, scheduled, or partially paid payables with a positive balance.",
        );
      }

      const amount = Number(paymentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
      }

      const currency = currentPayable.currency ?? "EGP";

      return adminFetch("/api/admin/finance/payables/payments", {
        method: "POST",
        body: JSON.stringify({
          payableId,
          amount,
          currency,
          paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
        }),
      });
    },
    onSuccess: () => {
      invalidateFinance();
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      toast({
        title: "Settlement recorded",
        description: "Payable payment was submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to record settlement",
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
        Loading payable details...
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">
            Unable to load payable details
          </CardTitle>
          <CardDescription>
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Please refresh and try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`${workspaceBasePath}/payables`}>Back to payables</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { payable, lines, payments, approvals } = detailQuery.data;
  const canRecordSettlement = canRecordPayableSettlement(
    payable.status,
    payable.balance_amount,
  );
  const hasPendingSubmitApproval = approvals.some(
    (approval) =>
      approval.entity_type === "finance_payable" &&
      approval.action === "payable_submit" &&
      approval.status === "pending",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`${workspaceBasePath}/payables`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to payables
          </Link>
        </Button>

        <Badge variant={statusBadgeVariant(payable.status)}>
          {payable.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{payable.payable_number}</CardTitle>
          <CardDescription>
            {payable.counterparty_name || "Unknown counterparty"} • Issued{" "}
            {formatDate(payable.issue_date)} • Due{" "}
            {formatDate(payable.due_date)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(payable.total_amount, payable.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Paid
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(payable.paid_amount, payable.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Balance
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(payable.balance_amount, payable.currency)}
            </p>
          </div>

          {payable.notes ? (
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="text-sm text-foreground/90">{payable.notes}</p>
            </div>
          ) : null}

          <div className="md:col-span-3 flex flex-wrap gap-2">
            {payable.status === "draft" && !hasPendingSubmitApproval ? (
              <Button
                size="sm"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit payable
              </Button>
            ) : null}

            {payable.status === "draft" ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel payable
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>
            Mapped expense/COGS lines used for AP posting entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No line items available.
            </p>
          ) : null}

          {lines.map((line) => (
            <div
              key={line.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex justify-between gap-2">
                <p>{line.description}</p>
                <p className="font-medium">
                  {formatCurrency(line.amount, payable.currency)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Account id: {line.finance_chart_account_id || "Not mapped yet"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Record payable settlement
          </CardTitle>
          <CardDescription>
            Submit outgoing payment against this payable. Approval may be
            required.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(
                  value as "bank_transfer" | "cash" | "card" | "gateway",
                )
              }
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
            <Label>Reference</Label>
            <Input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Optional reference"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={paymentNotes}
              onChange={(event) => setPaymentNotes(event.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending || !canRecordSettlement}
            >
              {paymentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              Record settlement
            </Button>
            {!canRecordSettlement ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Settlement is only available for approved, scheduled, or
                partially paid payables with a positive balance.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No settlements recorded yet.
              </p>
            ) : null}

            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <Badge variant={statusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(payment.payment_date)} •{" "}
                  {payment.payment_method}
                </p>
                {payment.reference ? (
                  <p className="text-xs text-muted-foreground">
                    Ref: {payment.reference}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approval events on this payable yet.
              </p>
            ) : null}

            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {approval.action.replace(/_/g, " ")}
                  </p>
                  <Badge variant={statusBadgeVariant(approval.status)}>
                    {approval.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {approval.entity_type} • {formatDateTime(approval.created_at)}
                </p>
                {approval.reason ? (
                  <p className="text-xs text-muted-foreground">
                    {approval.reason}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
