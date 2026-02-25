"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Send, XCircle } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox, type ComboOption } from "@/components/ui/combobox";

type FinancePayablesWorkspaceProps = {
  workspaceBasePath: string;
};

type Counterparty = {
  id: string;
  name: string;
  kind: string;
  is_active: boolean;
};

type ChartAccount = {
  id: string;
  account_code: string;
  name: string;
  account_type: string;
  is_active: boolean;
};

type PayableRow = {
  id: string;
  payable_number: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  counterparty_name: string | null;
  has_pending_approval: boolean;
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

const PAYABLES_QUERY_KEY = ["finance", "payables"] as const;
const PAYABLE_PAYMENTS_QUERY_KEY = ["finance", "payables", "payments"] as const;
const COUNTERPARTIES_QUERY_KEY = ["finance", "counterparties"] as const;
const CHART_ACCOUNTS_QUERY_KEY = ["finance", "chart-accounts"] as const;
const COUNTERPARTY_KIND_OPTIONS = [
  { value: "vendor", label: "Vendor" },
  { value: "service_provider", label: "Service Provider" },
  { value: "hospital", label: "Hospital" },
  { value: "hotel", label: "Hotel" },
  { value: "insurance", label: "Insurance" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
] as const;

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
    return formatCurrency(0, "EGP");
  }

  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" | ");
};

const statusBadgeVariant = (status?: string | null) => {
  switch (status) {
    case "paid":
    case "approved":
      return "success" as const;
    case "partially_paid":
    case "scheduled":
      return "secondary" as const;
    case "cancelled":
      return "outline" as const;
    case "draft":
      return "default" as const;
    default:
      return "secondary" as const;
  }
};

export function FinancePayablesWorkspace({
  workspaceBasePath,
}: FinancePayablesWorkspaceProps) {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();

  const [counterpartyId, setCounterpartyId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [currency, setCurrency] = useState<
    "EGP" | "USD" | "EUR" | "GBP" | "SAR" | "AED"
  >("EGP");
  const [lineDescription, setLineDescription] =
    useState<string>("Supplier payable");
  const [lineAmount, setLineAmount] = useState<string>("");
  const [lineAccountId, setLineAccountId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [counterpartyDialogOpen, setCounterpartyDialogOpen] =
    useState<boolean>(false);
  const [counterpartyName, setCounterpartyName] = useState<string>("");
  const [counterpartyKind, setCounterpartyKind] = useState<string>("vendor");
  const [counterpartyExternalCode, setCounterpartyExternalCode] =
    useState<string>("");
  const [counterpartyContactEmail, setCounterpartyContactEmail] =
    useState<string>("");
  const [counterpartyContactPhone, setCounterpartyContactPhone] =
    useState<string>("");
  const [paymentsDateFrom, setPaymentsDateFrom] = useState<string>("");
  const [paymentsDateTo, setPaymentsDateTo] = useState<string>("");
  const [paymentsMethodFilter, setPaymentsMethodFilter] =
    useState<string>("all");
  const [paymentsStatusFilter, setPaymentsStatusFilter] =
    useState<string>("all");
  const [paymentsSearch, setPaymentsSearch] = useState<string>("");

  const payablesQuery = useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: () => adminFetch<PayableRow[]>("/api/admin/finance/payables"),
    staleTime: 30_000,
  });

  const paymentsRegisterQuery = useQuery({
    queryKey: PAYABLE_PAYMENTS_QUERY_KEY,
    queryFn: () =>
      adminFetch<PayablePaymentRow[]>("/api/admin/finance/payables/payments"),
    staleTime: 30_000,
  });

  const counterpartiesQuery = useQuery({
    queryKey: COUNTERPARTIES_QUERY_KEY,
    queryFn: () =>
      adminFetch<Counterparty[]>(
        "/api/admin/finance/counterparties?isActive=true",
      ),
    staleTime: 30_000,
  });

  const chartAccountsQuery = useQuery({
    queryKey: CHART_ACCOUNTS_QUERY_KEY,
    queryFn: () =>
      adminFetch<ChartAccount[]>("/api/admin/finance/chart-accounts"),
    staleTime: 60_000,
  });

  const expenseAccounts = useMemo(
    () =>
      (chartAccountsQuery.data ?? []).filter(
        (account) =>
          account.is_active &&
          (account.account_type === "expense" ||
            account.account_type === "cogs"),
      ),
    [chartAccountsQuery.data],
  );
  const counterpartyOptions = useMemo<ComboOption[]>(
    () =>
      (counterpartiesQuery.data ?? [])
        .map((counterparty) => ({
          value: counterparty.id,
          label: counterparty.name,
          description: humanizeFinanceLabel(counterparty.kind),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [counterpartiesQuery.data],
  );

  const payableById = useMemo(() => {
    const map = new Map<string, PayableRow>();
    for (const row of payablesQuery.data ?? []) {
      map.set(row.id, row);
    }
    return map;
  }, [payablesQuery.data]);

  const paymentMethodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (paymentsRegisterQuery.data ?? [])
            .map((payment) => payment.payment_method)
            .filter((value) => typeof value === "string" && value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [paymentsRegisterQuery.data],
  );

  const paymentStatusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (paymentsRegisterQuery.data ?? [])
            .map((payment) => payment.status)
            .filter((value) => typeof value === "string" && value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [paymentsRegisterQuery.data],
  );

  const filteredPayments = useMemo(() => {
    const normalizedSearch = paymentsSearch.trim().toLowerCase();
    const fromTime = paymentsDateFrom
      ? Date.parse(`${paymentsDateFrom}T00:00:00Z`)
      : null;
    const toTime = paymentsDateTo
      ? Date.parse(`${paymentsDateTo}T23:59:59Z`)
      : null;

    return (paymentsRegisterQuery.data ?? []).filter((payment) => {
      if (
        paymentsMethodFilter !== "all" &&
        payment.payment_method !== paymentsMethodFilter
      ) {
        return false;
      }

      if (
        paymentsStatusFilter !== "all" &&
        payment.status !== paymentsStatusFilter
      ) {
        return false;
      }

      if (fromTime !== null || toTime !== null) {
        const paymentTime = Date.parse(payment.payment_date);
        if (!Number.isFinite(paymentTime)) {
          return false;
        }
        if (fromTime !== null && paymentTime < fromTime) {
          return false;
        }
        if (toTime !== null && paymentTime > toTime) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const payable = payment.finance_payable_id
        ? payableById.get(payment.finance_payable_id)
        : null;
      const tokens = [
        payment.finance_payable_id ?? "",
        payable?.payable_number ?? "",
        payment.reference ?? "",
      ].map((value) => value.toLowerCase());

      return tokens.some((token) => token.includes(normalizedSearch));
    });
  }, [
    paymentsRegisterQuery.data,
    paymentsMethodFilter,
    paymentsStatusFilter,
    paymentsDateFrom,
    paymentsDateTo,
    paymentsSearch,
    payableById,
  ]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(lineAmount);
      if (!counterpartyId) {
        throw new Error("Select a counterparty.");
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid payable amount.");
      }
      if (!lineDescription.trim()) {
        throw new Error("Line description is required.");
      }

      return adminFetch<{ payable: { id: string; payable_number: string } }>(
        "/api/admin/finance/payables",
        {
          method: "POST",
          body: JSON.stringify({
            counterpartyId,
            issueDate: issueDate || undefined,
            dueDate: dueDate || undefined,
            currency,
            notes: notes || undefined,
            lines: [
              {
                description: lineDescription.trim(),
                amount,
                financeChartAccountId: lineAccountId || undefined,
              },
            ],
          }),
        },
      );
    },
    onSuccess: () => {
      invalidateFinance();
      setLineAmount("");
      setNotes("");
      toast({
        title: "Payable created",
        description: "Draft payable was created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create payable",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCounterpartyMutation = useMutation({
    mutationFn: async () => {
      const name = counterpartyName.trim();
      const kind = counterpartyKind.trim();

      if (!name) {
        throw new Error("Counterparty name is required.");
      }

      if (!kind) {
        throw new Error("Counterparty type is required.");
      }

      return adminFetch<Counterparty>("/api/admin/finance/counterparties", {
        method: "POST",
        body: JSON.stringify({
          name,
          kind,
          externalCode: counterpartyExternalCode.trim() || undefined,
          contactEmail: counterpartyContactEmail.trim() || undefined,
          contactPhone: counterpartyContactPhone.trim() || undefined,
          isActive: true,
        }),
      });
    },
    onSuccess: (counterparty) => {
      invalidateFinance();
      setCounterpartyId(counterparty.id);
      setCounterpartyDialogOpen(false);
      setCounterpartyName("");
      setCounterpartyKind("vendor");
      setCounterpartyExternalCode("");
      setCounterpartyContactEmail("");
      setCounterpartyContactPhone("");
      toast({
        title: "Counterparty created",
        description: `${counterparty.name} is now available in the dropdown.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create counterparty",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch(`/api/admin/finance/payables/${id}/submit`, {
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
    mutationFn: async (id: string) =>
      adminFetch(`/api/admin/finance/payables/${id}/cancel`, {
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

  const totals = useMemo(() => {
    const rows = payablesQuery.data ?? [];
    const open = rows.filter((row) =>
      ["approved", "scheduled", "partially_paid"].includes(row.status),
    );
    const openBalanceByCurrency = sumByCurrency(
      open,
      (row) => row.balance_amount ?? 0,
      "EGP",
    );
    const windowStart = startOfUtcDay(new Date());
    const windowEnd = new Date(windowStart);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 7);

    const dueThisWeek = open.filter((row) => {
      const dueDate = row.due_date;
      if (!dueDate) return false;
      const due = new Date(`${dueDate}T00:00:00.000Z`);
      if (!Number.isFinite(due.getTime())) return false;
      return due >= windowStart && due <= windowEnd;
    });

    return {
      openCount: open.length,
      openBalanceByCurrency,
      dueThisWeekCount: dueThisWeek.length,
      pendingApprovals: rows.filter((row) => row.has_pending_approval).length,
    };
  }, [payablesQuery.data]);

  return (
    <div className="space-y-6">
      <Dialog
        open={counterpartyDialogOpen}
        onOpenChange={setCounterpartyDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add counterparty</DialogTitle>
            <DialogDescription>
              Create a supplier/vendor so it can be selected for payables.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="counterparty-name">Name</Label>
              <Input
                id="counterparty-name"
                value={counterpartyName}
                onChange={(event) => setCounterpartyName(event.target.value)}
                placeholder="e.g. Nile Travel Services"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty-kind">Type</Label>
              <Select
                value={counterpartyKind}
                onValueChange={setCounterpartyKind}
              >
                <SelectTrigger id="counterparty-kind">
                  <SelectValue placeholder="Select counterparty type" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTERPARTY_KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty-external-code">
                External code (optional)
              </Label>
              <Input
                id="counterparty-external-code"
                value={counterpartyExternalCode}
                onChange={(event) =>
                  setCounterpartyExternalCode(event.target.value)
                }
                placeholder="e.g. VEN-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty-contact-email">
                Contact email (optional)
              </Label>
              <Input
                id="counterparty-contact-email"
                type="email"
                value={counterpartyContactEmail}
                onChange={(event) =>
                  setCounterpartyContactEmail(event.target.value)
                }
                placeholder="ap@vendor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty-contact-phone">
                Contact phone (optional)
              </Label>
              <Input
                id="counterparty-contact-phone"
                value={counterpartyContactPhone}
                onChange={(event) =>
                  setCounterpartyContactPhone(event.target.value)
                }
                placeholder="+20..."
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCounterpartyDialogOpen(false)}
              disabled={createCounterpartyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createCounterpartyMutation.mutate()}
              disabled={createCounterpartyMutation.isPending}
            >
              {createCounterpartyMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create counterparty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Payables
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage vendor liabilities, approval submission, and settlement
          readiness.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open payables</CardDescription>
            <CardTitle>{totals.openCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open balance</CardDescription>
            <CardTitle>
              {formatCurrencyBreakdown(totals.openBalanceByCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due this week</CardDescription>
            <CardTitle>{totals.dueThisWeekCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending approvals</CardDescription>
            <CardTitle>{totals.pendingApprovals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create payable draft
          </CardTitle>
          <CardDescription>
            Drafts remain editable until submitted for threshold-based approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Counterparty</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCounterpartyDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add counterparty
              </Button>
            </div>
            <ComboBox
              value={counterpartyId}
              options={counterpartyOptions}
              placeholder="Select counterparty"
              searchPlaceholder="Search counterparties..."
              emptyLabel="No counterparties found."
              disabled={counterpartiesQuery.isLoading}
              onChange={setCounterpartyId}
              contentClassName="w-[min(520px,calc(100vw-4rem))] p-0"
            />
            {!counterpartiesQuery.isLoading &&
            (counterpartiesQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No active counterparties yet. Use &quot;Add counterparty&quot;
                to create one.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Issue date</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={currency}
              onValueChange={(value) =>
                setCurrency(
                  value as "EGP" | "USD" | "EUR" | "GBP" | "SAR" | "AED",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["EGP", "USD", "EUR", "GBP", "SAR", "AED"].map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Line amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={lineAmount}
              onChange={(event) => setLineAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Line description</Label>
            <Input
              value={lineDescription}
              onChange={(event) => setLineDescription(event.target.value)}
              placeholder="Describe payable line"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Line account (recommended)</Label>
            <Select value={lineAccountId} onValueChange={setLineAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select expense/COGS account" />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (Code: {account.account_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional payable notes"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create payable draft
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Payments register</CardTitle>
              <CardDescription>
                Global payable payment view with method, status, and date
                filters.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => paymentsRegisterQuery.refetch()}
              disabled={paymentsRegisterQuery.isFetching}
            >
              {paymentsRegisterQuery.isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Date from</Label>
              <Input
                type="date"
                value={paymentsDateFrom}
                onChange={(event) => setPaymentsDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date to</Label>
              <Input
                type="date"
                value={paymentsDateTo}
                onChange={(event) => setPaymentsDateTo(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={paymentsMethodFilter}
                onValueChange={setPaymentsMethodFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {humanizeFinanceLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={paymentsStatusFilter}
                onValueChange={setPaymentsStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {paymentStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {humanizeFinanceLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search payable/ref</Label>
              <Input
                value={paymentsSearch}
                onChange={(event) => setPaymentsSearch(event.target.value)}
                placeholder="Payable id, number, or reference"
              />
            </div>
          </div>

          {paymentsRegisterQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payments register...
            </div>
          ) : null}

          {paymentsRegisterQuery.isError ? (
            <p className="text-sm text-destructive">
              Unable to load payments register.
            </p>
          ) : null}

          {filteredPayments.length === 0 && !paymentsRegisterQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              No payment rows match current filters.
            </p>
          ) : null}

          <div className="space-y-2">
            {filteredPayments.map((payment) => {
              const payable = payment.finance_payable_id
                ? payableById.get(payment.finance_payable_id)
                : null;
              const payableLabel =
                payable?.payable_number || payment.finance_payable_id || "N/A";

              return (
                <div
                  key={payment.id}
                  className="rounded-lg border border-border/70 bg-card p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.payment_date)} •{" "}
                        {humanizeFinanceLabel(payment.payment_method)}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant(payment.status)}>
                      {humanizeFinanceLabel(payment.status)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Payable: {payableLabel}</span>
                    {payment.reference ? (
                      <span>Ref: {payment.reference}</span>
                    ) : null}
                  </div>

                  {payment.finance_payable_id ? (
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`${workspaceBasePath}/payables/${payment.finance_payable_id}`}
                        >
                          Open payable
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payables list</CardTitle>
          <CardDescription>
            Track payable lifecycle, approval state, and balances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payablesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payables...
            </div>
          ) : null}

          {(payablesQuery.data ?? []).length === 0 &&
          !payablesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              No payables found yet.
            </p>
          ) : null}

          {(payablesQuery.data ?? []).map((payable) => (
            <div
              key={payable.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{payable.payable_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {payable.counterparty_name || "Unknown vendor"} • Issued{" "}
                    {formatDate(payable.issue_date)} • Due{" "}
                    {formatDate(payable.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {payable.has_pending_approval ? (
                    <Badge variant="secondary">Pending approval</Badge>
                  ) : null}
                  <Badge variant={statusBadgeVariant(payable.status)}>
                    {humanizeFinanceLabel(payable.status)}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <p>
                  Total:{" "}
                  {formatCurrency(payable.total_amount, payable.currency)}
                </p>
                <p>
                  Paid: {formatCurrency(payable.paid_amount, payable.currency)}
                </p>
                <p>
                  Balance:{" "}
                  {formatCurrency(payable.balance_amount, payable.currency)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`${workspaceBasePath}/payables/${payable.id}`}>
                    View details
                  </Link>
                </Button>

                {payable.status === "draft" && !payable.has_pending_approval ? (
                  <Button
                    size="sm"
                    onClick={() => submitMutation.mutate(payable.id)}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                ) : null}

                {payable.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(payable.id)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
