"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
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

type JournalRow = {
  id: string;
  entry_number: string;
  entry_date: string;
  source_type: string | null;
  source_id: string | null;
  description: string | null;
  currency: string;
  status: string;
  total_debit: number;
  total_credit: number;
  lines_count: number;
};

const JOURNALS_QUERY_KEY = ["finance", "journal-entries"] as const;

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

const statusBadgeVariant = (status?: string | null) => {
  if (status === "posted") return "success" as const;
  if (status === "reversed") return "outline" as const;
  return "secondary" as const;
};

export function FinanceJournalWorkspace() {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();

  const journalsQuery = useQuery({
    queryKey: JOURNALS_QUERY_KEY,
    queryFn: () =>
      adminFetch<JournalRow[]>("/api/admin/finance/journal-entries"),
    staleTime: 30_000,
  });

  const backfillMutation = useMutation({
    mutationFn: async () =>
      adminFetch<{
        invoices: number;
        payments: number;
        creditAdjustments: number;
        payables: number;
        payablePayments: number;
      }>("/api/admin/finance/journal-entries/backfill", {
        method: "POST",
      }),
    onSuccess: (result) => {
      invalidateFinance();
      toast({
        title: "Ledger backfill completed",
        description: `Invoices: ${result.invoices}, payments: ${result.payments}, payables: ${result.payables}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to run backfill",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const totals = useMemo(() => {
    const rows = journalsQuery.data ?? [];
    const debit = rows.reduce((sum, row) => sum + (row.total_debit ?? 0), 0);
    const credit = rows.reduce((sum, row) => sum + (row.total_credit ?? 0), 0);
    return {
      count: rows.length,
      debit,
      credit,
      balanced: Math.abs(debit - credit) <= 0.01,
    };
  }, [journalsQuery.data]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Journal Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Review posted accounting entries generated from AR/AP lifecycle
          events.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entries</CardDescription>
            <CardTitle>{totals.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total debits</CardDescription>
            <CardTitle>{formatCurrency(totals.debit, "EGP")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total credits</CardDescription>
            <CardTitle>{formatCurrency(totals.credit, "EGP")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance state</CardDescription>
            <CardTitle>
              {totals.balanced ? "Balanced" : "Out of balance"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger maintenance</CardTitle>
          <CardDescription>
            Run idempotent backfill to post historical AR/AP records missing
            journal entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isPending}
          >
            {backfillMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Run ledger backfill
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest entries</CardTitle>
          <CardDescription>
            Most recent posted journals with source traceability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {journalsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading journal entries...
            </div>
          ) : null}

          {(journalsQuery.data ?? []).length === 0 &&
          !journalsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              No journal entries posted yet.
            </p>
          ) : null}

          {(journalsQuery.data ?? []).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{entry.entry_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.entry_date)} •{" "}
                    {entry.source_type || "manual"}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(entry.status)}>
                  {entry.status}
                </Badge>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <p>
                  Debit:{" "}
                  {formatCurrency(entry.total_debit, entry.currency || "EGP")}
                </p>
                <p>
                  Credit:{" "}
                  {formatCurrency(entry.total_credit, entry.currency || "EGP")}
                </p>
                <p>Lines: {entry.lines_count}</p>
              </div>

              {entry.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {entry.description}
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
