"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
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
import {
  WorkspaceMetricCard,
  WorkspacePageHeader,
} from "@/components/workspaces/WorkspacePrimitives";

type FinanceJournalWorkspaceProps = {
  workspaceBasePath: string;
};

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

export function FinanceJournalWorkspace({
  workspaceBasePath,
}: FinanceJournalWorkspaceProps) {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();
  const { profile } = useUserProfile();
  const capabilities = useMemo(
    () => resolveFinanceCapabilities(profile?.permissions, profile?.roles),
    [profile?.permissions, profile?.roles],
  );
  const canViewJournalEntries = capabilities.canViewJournalEntries;
  const canRunBackfill = capabilities.canRunLedgerBackfill;

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sourceType, setSourceType] = useState<string>("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom.trim().length > 0) {
      params.set("dateFrom", dateFrom.trim());
    }
    if (dateTo.trim().length > 0) {
      params.set("dateTo", dateTo.trim());
    }
    if (sourceType.trim().length > 0) {
      params.set("sourceType", sourceType.trim());
    }
    return params.toString();
  }, [dateFrom, dateTo, sourceType]);

  const journalsQuery = useQuery({
    queryKey: [...JOURNALS_QUERY_KEY, queryString],
    queryFn: () =>
      adminFetch<JournalRow[]>(
        `/api/admin/finance/journal-entries${queryString ? `?${queryString}` : ""}`,
      ),
    enabled: canViewJournalEntries,
    staleTime: 30_000,
  });

  const backfillMutation = useMutation({
    mutationFn: async () => {
      if (!canRunBackfill) {
        throw new Error(
          "finance.settings or finance.approvals permission is required.",
        );
      }
      return adminFetch<{
        invoices: number;
        payments: number;
        creditAdjustments: number;
        payables: number;
        payablePayments: number;
      }>("/api/admin/finance/journal-entries/backfill", {
        method: "POST",
      });
    },
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

  if (!canViewJournalEntries && !canRunBackfill) {
    return (
      <div className="space-y-8">
        <WorkspacePageHeader
          breadcrumb="Finance / Journal"
          title="Journal Explorer"
          subtitle="Review posted accounting entries generated from AR/AP lifecycle events."
        />
        <Card className="border-border/80 bg-muted/20">
          <CardHeader>
            <CardTitle>Journal access is required</CardTitle>
            <CardDescription>
              This page is hidden for roles without report or maintenance
              capabilities.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Finance / Journal"
        title="Journal Explorer"
        subtitle="Review posted accounting entries generated from AR/AP lifecycle events."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <WorkspaceMetricCard
          label="Entries"
          value={canViewJournalEntries ? totals.count : "-"}
          helperText="Posted journal entries matching the current filter set."
        />
        <WorkspaceMetricCard
          label="Total debits"
          value={
            canViewJournalEntries ? formatCurrency(totals.debit, "EGP") : "-"
          }
          valueDensity="compact"
          helperText="Debit-side total across the visible journal selection."
        />
        <WorkspaceMetricCard
          label="Total credits"
          value={
            canViewJournalEntries ? formatCurrency(totals.credit, "EGP") : "-"
          }
          valueDensity="compact"
          helperText="Credit-side total across the visible journal selection."
        />
        <WorkspaceMetricCard
          label="Balance state"
          value={
            canViewJournalEntries
              ? totals.balanced
                ? "Balanced"
                : "Out of balance"
              : "-"
          }
          valueDensity="compact"
          helperText="Quick balance check for the journals currently in view."
          emphasisTone={totals.balanced ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter journal rows by date range and source type.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Date from</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date to</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Source type</Label>
            <Input
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
              placeholder="e.g. Finance invoice"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSourceType("");
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => journalsQuery.refetch()}
              disabled={journalsQuery.isFetching || !canViewJournalEntries}
            >
              {journalsQuery.isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger maintenance</CardTitle>
          <CardDescription>
            Run idempotent backfill to post historical AR/AP records missing
            journal entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canRunBackfill ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">
              Ledger backfill is available to approvals/settings roles.
            </p>
          )}
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
          {canViewJournalEntries ? (
            <>
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
                <div
                  key={entry.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{entry.entry_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.entry_date)} •{" "}
                        {humanizeFinanceLabel(entry.source_type || "manual")}
                        {entry.source_id ? ` • ${entry.source_id}` : ""}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant(entry.status)}>
                      {humanizeFinanceLabel(entry.status)}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <p>
                      Debit:{" "}
                      {formatCurrency(
                        entry.total_debit,
                        entry.currency || "EGP",
                      )}
                    </p>
                    <p>
                      Credit:{" "}
                      {formatCurrency(
                        entry.total_credit,
                        entry.currency || "EGP",
                      )}
                    </p>
                    <p>Lines: {entry.lines_count}</p>
                  </div>

                  {entry.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`${workspaceBasePath}/ledger/journals/${entry.id}`}
                      >
                        Open entry
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Journal entry history is hidden for roles without reports access.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
