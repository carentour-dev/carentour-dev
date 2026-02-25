"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import {
  canEditPayableDraft,
  canRecordPayableSettlement,
  hasPendingPayableSubmitApproval,
} from "@/lib/finance/payablesState";
import { humanizeFinanceLabel } from "@/lib/finance/labels";
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
import { Textarea } from "@/components/ui/textarea";

type FinancePayableDetailProps = {
  workspaceBasePath: string;
};

type PayableDetailResponse = {
  payable: {
    id: string;
    payable_number: string;
    status: string;
    counterparty_id: string | null;
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

type Counterparty = {
  id: string;
  name: string;
  kind: string;
};

type PayablePaymentRow = {
  id: string;
  finance_payable_id: string | null;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  payment_group_id: string | null;
  reference: string | null;
  notes: string | null;
};

type DraftPayableLineForm = {
  localId: string;
  description: string;
  amount: string;
  financeChartAccountId: string;
};

type DraftPayableForm = {
  counterpartyId: string;
  issueDate: string;
  dueDate: string;
  currency: "EGP" | "USD" | "EUR" | "GBP" | "SAR" | "AED";
  notes: string;
  lines: DraftPayableLineForm[];
};

const FINANCE_CURRENCY_OPTIONS = [
  "EGP",
  "USD",
  "EUR",
  "GBP",
  "SAR",
  "AED",
] as const;

const toLineId = () =>
  `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildDraftForm = (data: PayableDetailResponse): DraftPayableForm => ({
  counterpartyId: data.payable.counterparty_id ?? "",
  issueDate: data.payable.issue_date ?? "",
  dueDate: data.payable.due_date ?? "",
  currency: FINANCE_CURRENCY_OPTIONS.includes(
    data.payable.currency as (typeof FINANCE_CURRENCY_OPTIONS)[number],
  )
    ? (data.payable.currency as DraftPayableForm["currency"])
    : "EGP",
  notes: data.payable.notes ?? "",
  lines:
    data.lines.length > 0
      ? data.lines.map((line) => ({
          localId: line.id || toLineId(),
          description: line.description ?? "",
          amount: String(Number.isFinite(line.amount) ? line.amount : ""),
          financeChartAccountId: line.finance_chart_account_id ?? "",
        }))
      : [
          {
            localId: toLineId(),
            description: "",
            amount: "",
            financeChartAccountId: "",
          },
        ],
});

const resolvePayableEditError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Please try again.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("only draft payables can be edited") ||
    normalized.includes(
      "cannot edit payable while an approval request is pending",
    )
  ) {
    return {
      title: "Draft is locked",
      description:
        "This payable can no longer be edited because it is not an editable draft.",
    };
  }

  if (
    normalized.includes("validation failed") ||
    normalized.includes("issue date") ||
    normalized.includes("due date") ||
    normalized.includes("line")
  ) {
    return {
      title: "Invalid draft changes",
      description: message,
    };
  }

  return {
    title: "Failed to update payable draft",
    description: message,
  };
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
  const [isEditDraftMode, setIsEditDraftMode] = useState<boolean>(false);
  const [draftForm, setDraftForm] = useState<DraftPayableForm | null>(null);

  const detailQuery = useQuery({
    queryKey: ["finance", "payables", payableId],
    enabled: payableId.length > 0,
    queryFn: () =>
      adminFetch<PayableDetailResponse>(
        `/api/admin/finance/payables/${payableId}`,
      ),
  });

  const counterpartiesQuery = useQuery({
    queryKey: ["finance", "counterparties", "editable", payableId],
    enabled: payableId.length > 0 && isEditDraftMode,
    queryFn: () =>
      adminFetch<Counterparty[]>(
        "/api/admin/finance/counterparties?isActive=true",
      ),
    staleTime: 30_000,
  });

  const paymentsHistoryQuery = useQuery({
    queryKey: ["finance", "payables", payableId, "payments"],
    enabled: payableId.length > 0,
    queryFn: () =>
      adminFetch<PayablePaymentRow[]>(
        `/api/admin/finance/payables/${payableId}/payments`,
      ),
    staleTime: 30_000,
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

  const editDraftMutation = useMutation({
    mutationFn: async () => {
      const currentPayable = detailQuery.data?.payable;
      if (!currentPayable || !draftForm) {
        throw new Error("Payable draft is not ready.");
      }

      if (
        !canEditPayableDraft({
          status: currentPayable.status,
          approvals: detailQuery.data?.approvals,
        })
      ) {
        throw new Error(
          "Cannot edit payable while an approval request is pending",
        );
      }

      const normalizedLines = draftForm.lines
        .map((line) => ({
          description: line.description.trim(),
          amount: Number(line.amount),
          financeChartAccountId: line.financeChartAccountId || undefined,
        }))
        .filter((line) => line.description.length > 0 || line.amount > 0);

      if (normalizedLines.length === 0) {
        throw new Error("Add at least one payable line.");
      }

      const hasInvalidLine = normalizedLines.some(
        (line) => !Number.isFinite(line.amount) || line.amount <= 0,
      );
      if (hasInvalidLine) {
        throw new Error(
          "Line amounts must be valid numbers greater than zero.",
        );
      }

      if (!draftForm.counterpartyId) {
        throw new Error("Select a counterparty.");
      }

      return adminFetch(`/api/admin/finance/payables/${payableId}`, {
        method: "PATCH",
        body: JSON.stringify({
          counterpartyId: draftForm.counterpartyId,
          issueDate: draftForm.issueDate || undefined,
          dueDate: draftForm.dueDate || undefined,
          currency: draftForm.currency,
          notes: draftForm.notes || undefined,
          lines: normalizedLines,
        }),
      });
    },
    onSuccess: async () => {
      invalidateFinance();
      await detailQuery.refetch();
      await paymentsHistoryQuery.refetch();
      setIsEditDraftMode(false);
      setDraftForm(null);
      toast({
        title: "Payable draft updated",
        description: "Draft changes were saved successfully.",
      });
    },
    onError: (error) => {
      const resolved = resolvePayableEditError(error);
      toast({
        title: resolved.title,
        description: resolved.description,
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
    onSuccess: async () => {
      invalidateFinance();
      await paymentsHistoryQuery.refetch();
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

  const { payable, lines, approvals } = detailQuery.data;
  const payments = paymentsHistoryQuery.data ?? detailQuery.data.payments;
  const canRecordSettlement = canRecordPayableSettlement(
    payable.status,
    payable.balance_amount,
  );
  const hasPendingSubmitApproval = hasPendingPayableSubmitApproval(approvals);
  const canEditDraft = canEditPayableDraft({
    status: payable.status,
    approvals,
  });
  const isDraftStatus = payable.status === "draft";

  const enterEditDraftMode = () => {
    if (!canEditDraft) {
      return;
    }
    setDraftForm(buildDraftForm(detailQuery.data));
    setIsEditDraftMode(true);
  };

  const appendDraftLine = () => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lines: [
          ...prev.lines,
          {
            localId: toLineId(),
            description: "",
            amount: "",
            financeChartAccountId: "",
          },
        ],
      };
    });
  };

  const removeDraftLine = (lineId: string) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      if (prev.lines.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        lines: prev.lines.filter((line) => line.localId !== lineId),
      };
    });
  };

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
          {humanizeFinanceLabel(payable.status)}
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
            {isDraftStatus && canEditDraft && !isEditDraftMode ? (
              <Button size="sm" variant="outline" onClick={enterEditDraftMode}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit draft
              </Button>
            ) : null}

            {isDraftStatus && !canEditDraft ? (
              <p className="flex items-center text-xs text-muted-foreground">
                Draft editing is locked while submit approval is pending.
              </p>
            ) : null}

            {isDraftStatus && !hasPendingSubmitApproval ? (
              <Button
                size="sm"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || isEditDraftMode}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit payable
              </Button>
            ) : null}

            {isDraftStatus ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending || isEditDraftMode}
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

      {isEditDraftMode && draftForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Editable draft</CardTitle>
            <CardDescription>
              Update draft fields and save using the existing payable PATCH API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Counterparty</Label>
                <Select
                  value={draftForm.counterpartyId}
                  onValueChange={(value) =>
                    setDraftForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            counterpartyId: value,
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select counterparty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(counterpartiesQuery.data ?? []).map((counterparty) => (
                      <SelectItem key={counterparty.id} value={counterparty.id}>
                        {`${counterparty.name} (${humanizeFinanceLabel(counterparty.kind)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {counterpartiesQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Loading counterparties...
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={draftForm.currency}
                  onValueChange={(value) =>
                    setDraftForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            currency: value as DraftPayableForm["currency"],
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCE_CURRENCY_OPTIONS.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={draftForm.issueDate}
                  onChange={(event) =>
                    setDraftForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            issueDate: event.target.value,
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={draftForm.dueDate}
                  onChange={(event) =>
                    setDraftForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            dueDate: event.target.value,
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={draftForm.notes}
                  onChange={(event) =>
                    setDraftForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            notes: event.target.value,
                          }
                        : prev,
                    )
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Lines</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={appendDraftLine}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add line
                </Button>
              </div>

              {draftForm.lines.map((line, index) => (
                <div
                  key={line.localId}
                  className="grid gap-3 rounded-lg border border-border/60 p-3 md:grid-cols-7"
                >
                  <div className="space-y-2 md:col-span-3">
                    <Label>Description</Label>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        setDraftForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                lines: prev.lines.map((row) =>
                                  row.localId === line.localId
                                    ? {
                                        ...row,
                                        description: event.target.value,
                                      }
                                    : row,
                                ),
                              }
                            : prev,
                        )
                      }
                      placeholder={`Line ${index + 1}`}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.amount}
                      onChange={(event) =>
                        setDraftForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                lines: prev.lines.map((row) =>
                                  row.localId === line.localId
                                    ? { ...row, amount: event.target.value }
                                    : row,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Chart account id</Label>
                    <Input
                      value={line.financeChartAccountId}
                      onChange={(event) =>
                        setDraftForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                lines: prev.lines.map((row) =>
                                  row.localId === line.localId
                                    ? {
                                        ...row,
                                        financeChartAccountId:
                                          event.target.value,
                                      }
                                    : row,
                                ),
                              }
                            : prev,
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div className="md:col-span-7 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDraftLine(line.localId)}
                      disabled={draftForm.lines.length <= 1}
                    >
                      Remove line
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => editDraftMutation.mutate()}
                disabled={editDraftMutation.isPending}
              >
                {editDraftMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save draft changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDraftMode(false);
                  setDraftForm(null);
                }}
                disabled={editDraftMutation.isPending}
              >
                Cancel editing
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isEditDraftMode ? (
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
                  Account id:{" "}
                  {line.finance_chart_account_id || "Not mapped yet"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

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
              disabled={
                paymentMutation.isPending ||
                !canRecordSettlement ||
                isEditDraftMode
              }
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
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Payment history</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => paymentsHistoryQuery.refetch()}
                disabled={paymentsHistoryQuery.isFetching}
              >
                {paymentsHistoryQuery.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {paymentsHistoryQuery.isError ? (
              <p className="text-sm text-destructive">
                Unable to load payment history.
              </p>
            ) : null}

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
                    {humanizeFinanceLabel(payment.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(payment.payment_date)} •{" "}
                  {humanizeFinanceLabel(payment.payment_method)}
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
                    {humanizeFinanceLabel(approval.action)}
                  </p>
                  <Badge variant={statusBadgeVariant(approval.status)}>
                    {humanizeFinanceLabel(approval.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {humanizeFinanceLabel(approval.entity_type)} •{" "}
                  {formatDateTime(approval.created_at)}
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
