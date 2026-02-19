"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReportKind =
  | "ap-aging"
  | "trial-balance"
  | "profit-loss"
  | "balance-sheet";

type FinanceReportScreenProps = {
  report: ReportKind;
};

const REPORT_PATH: Record<ReportKind, string> = {
  "ap-aging": "/api/admin/finance/reports/ap-aging",
  "trial-balance": "/api/admin/finance/reports/trial-balance",
  "profit-loss": "/api/admin/finance/reports/profit-loss",
  "balance-sheet": "/api/admin/finance/reports/balance-sheet",
};

const REPORT_TITLE: Record<ReportKind, string> = {
  "ap-aging": "AP Aging",
  "trial-balance": "Trial Balance",
  "profit-loss": "Profit & Loss",
  "balance-sheet": "Balance Sheet",
};

const REPORT_DESCRIPTION: Record<ReportKind, string> = {
  "ap-aging": "Outstanding supplier balances bucketed by overdue age.",
  "trial-balance": "Debit/credit rollup by chart account in base currency.",
  "profit-loss": "Revenue, COGS/costs, expenses, and net income summary.",
  "balance-sheet": "Assets, liabilities, and equity position as of date.",
};

const formatCurrency = (value: number, currency = "EGP") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

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

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    parsed,
  );
};

export function FinanceReportScreen({ report }: FinanceReportScreenProps) {
  const reportQuery = useQuery({
    queryKey: ["finance", "reports", report],
    queryFn: () => adminFetch<Record<string, unknown>>(REPORT_PATH[report]),
    staleTime: 30_000,
  });

  const dueCalendarQuery = useQuery({
    queryKey: ["finance", "reports", "payables-due-calendar"],
    queryFn: () =>
      adminFetch<{
        from: string;
        to: string;
        rows: Array<{
          payableNumber: string;
          counterpartyName: string | null;
          dueDate: string;
          balanceAmount: number;
          currency: string;
          status: string;
        }>;
      }>("/api/admin/finance/reports/payables-due-calendar"),
    enabled: report === "ap-aging",
    staleTime: 30_000,
  });

  if (reportQuery.isLoading) {
    return (
      <div className="flex min-h-[35vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading report...
      </div>
    );
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">
            Failed to load report
          </CardTitle>
          <CardDescription>
            {reportQuery.error instanceof Error
              ? reportQuery.error.message
              : "Please refresh and try again."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const payload = reportQuery.data;
  const summaryGridClassName =
    report === "profit-loss"
      ? "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      : "grid gap-3 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {REPORT_TITLE[report]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {REPORT_DESCRIPTION[report]}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Snapshot generated from posted ledger and AP transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className={summaryGridClassName}>
          {report === "ap-aging" ? (
            <>
              <MetricCard
                label="As of"
                value={formatDate(String(payload.asOfDate ?? ""))}
              />
              <MetricCard
                label="Outstanding by currency"
                value={formatCurrencyBreakdown(
                  payload.totalsByCurrency as Record<string, number>,
                )}
              />
              <MetricCard
                label="Rows"
                value={String(
                  Array.isArray(payload.rows) ? payload.rows.length : 0,
                )}
              />
            </>
          ) : null}

          {report === "trial-balance" ? (
            <>
              <MetricCard
                label="Base currency"
                value={String(payload.baseCurrency ?? "EGP")}
              />
              <MetricCard
                label="Total debits"
                value={formatCurrency(
                  Number(payload.totalDebit ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Total credits"
                value={formatCurrency(
                  Number(payload.totalCredit ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
            </>
          ) : null}

          {report === "profit-loss" ? (
            <>
              <MetricCard
                label="Revenue"
                value={formatCurrency(
                  Number(payload.revenue ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="COGS / Costs"
                value={formatCurrency(
                  Number(payload.cogs ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Expenses"
                value={formatCurrency(
                  Number(payload.expenses ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Net income"
                value={formatCurrency(
                  Number(payload.netIncome ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
            </>
          ) : null}

          {report === "balance-sheet" ? (
            <>
              <MetricCard
                label="Assets"
                value={formatCurrency(
                  Number(payload.assets ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Liabilities"
                value={formatCurrency(
                  Number(payload.liabilities ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Equity + earnings"
                value={formatCurrency(
                  Number(payload.equityWithEarnings ?? 0),
                  String(payload.baseCurrency ?? "EGP"),
                )}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {report === "ap-aging" ? (
        <Card>
          <CardHeader>
            <CardTitle>Payables due calendar</CardTitle>
            <CardDescription>
              Upcoming AP obligations from{" "}
              {formatDate(dueCalendarQuery.data?.from)} to{" "}
              {formatDate(dueCalendarQuery.data?.to)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueCalendarQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading due calendar...
              </div>
            ) : null}

            {(dueCalendarQuery.data?.rows ?? []).slice(0, 20).map((row) => (
              <div
                key={`${row.payableNumber}-${row.dueDate}`}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{row.payableNumber}</p>
                  <p className="text-sm">
                    {formatCurrency(row.balanceAmount, row.currency)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.counterpartyName || "Vendor"} • Due{" "}
                  {formatDate(row.dueDate)} • {row.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Raw payload</CardTitle>
          <CardDescription>
            Structured API output for finance analysis and export tooling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
