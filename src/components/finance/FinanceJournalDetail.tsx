"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FinanceJournalDetailProps = {
  workspaceBasePath: string;
};

type JournalEntryDetailResponse = {
  entry: {
    id: string;
    entry_number: string;
    entry_date: string;
    source_type: string | null;
    source_id: string | null;
    description: string | null;
    currency: string;
    status: string;
    created_at: string;
  };
  source_transaction?: {
    amount: number;
    currency: string | null;
    fx_rate: number | null;
    reference: string | null;
    source: string | null;
  } | null;
  lines: Array<{
    id: string;
    finance_journal_entry_id: string;
    debit: number;
    credit: number;
    currency?: string | null;
    fx_rate?: number | null;
    description: string | null;
    cost_tag_case_id: string | null;
    cost_tag_department: string | null;
    finance_chart_accounts: {
      account_code: string;
      name: string;
      account_type: string;
    } | null;
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
  if (status === "posted") return "success" as const;
  if (status === "reversed") return "outline" as const;
  return "secondary" as const;
};

const hasDistinctSourceCurrency = (
  sourceCurrency?: string | null,
  ledgerCurrency?: string | null,
) =>
  Boolean(
    sourceCurrency &&
      ledgerCurrency &&
      sourceCurrency.trim().toUpperCase() !==
        ledgerCurrency.trim().toUpperCase(),
  );

export function FinanceJournalDetail({
  workspaceBasePath,
}: FinanceJournalDetailProps) {
  const params = useParams<{ id: string }>();
  const journalEntryId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useQuery({
    queryKey: ["finance", "journal-entry", journalEntryId],
    enabled: journalEntryId.length > 0,
    queryFn: () =>
      adminFetch<JournalEntryDetailResponse>(
        `/api/admin/finance/journal-entries/${journalEntryId}`,
      ),
  });

  const totals = useMemo(() => {
    const lines = detailQuery.data?.lines ?? [];
    const debit = lines.reduce((sum, line) => sum + (line.debit ?? 0), 0);
    const credit = lines.reduce((sum, line) => sum + (line.credit ?? 0), 0);
    return {
      debit,
      credit,
      balanced: Math.abs(debit - credit) <= 0.01,
    };
  }, [detailQuery.data?.lines]);

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading journal entry...
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">
            Unable to load journal entry
          </CardTitle>
          <CardDescription>
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Please refresh and try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`${workspaceBasePath}/ledger/journals`}>
              Back to journals
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    entry,
    lines,
    source_transaction: sourceTransaction,
  } = detailQuery.data;
  const sourceCurrency = sourceTransaction?.currency || entry.currency || "EGP";
  const showSourceTransaction = hasDistinctSourceCurrency(
    sourceTransaction?.currency,
    entry.currency,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`${workspaceBasePath}/ledger/journals`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to journals
          </Link>
        </Button>

        <Badge variant={statusBadgeVariant(entry.status)}>
          {humanizeFinanceLabel(entry.status)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{entry.entry_number}</CardTitle>
          <CardDescription>
            {formatDate(entry.entry_date)} •{" "}
            {humanizeFinanceLabel(entry.source_type || "manual")} • Created{" "}
            {formatDateTime(entry.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {showSourceTransaction && sourceTransaction ? (
            <div className="md:col-span-3 rounded-md border border-border/80 bg-muted/20 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Source transaction
              </p>
              <p className="text-sm font-medium">
                {formatCurrency(sourceTransaction.amount, sourceCurrency)}
                {sourceTransaction.fx_rate ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    converted at {sourceTransaction.fx_rate}{" "}
                    {entry.currency || "EGP"}
                  </span>
                ) : null}
              </p>
              {sourceTransaction.reference ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {sourceTransaction.reference}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Ledger debit
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(totals.debit, entry.currency || "EGP")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Ledger credit
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(totals.credit, entry.currency || "EGP")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Balance state
            </p>
            <p className="text-lg font-semibold">
              {totals.balanced ? "Balanced" : "Out of balance"}
            </p>
          </div>

          <div className="md:col-span-3 grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Source type:</span>{" "}
              {humanizeFinanceLabel(entry.source_type)}
            </p>
            <p>
              <span className="text-muted-foreground">Source id:</span>{" "}
              {entry.source_id || "-"}
            </p>
          </div>

          {entry.description ? (
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="text-sm text-foreground/90">{entry.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal lines</CardTitle>
          <CardDescription>
            Account-level posting lines for this journal entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lines were found for this entry.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account code</TableHead>
                  <TableHead>Account name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">
                    Debit ({entry.currency || "EGP"})
                  </TableHead>
                  <TableHead className="text-right">
                    Credit ({entry.currency || "EGP"})
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {line.finance_chart_accounts?.account_code || "-"}
                    </TableCell>
                    <TableCell>
                      {line.finance_chart_accounts?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {humanizeFinanceLabel(
                        line.finance_chart_accounts?.account_type,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.debit, entry.currency || "EGP")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.credit, entry.currency || "EGP")}
                    </TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>
                      {[line.cost_tag_case_id, line.cost_tag_department]
                        .filter(Boolean)
                        .join(" • ") || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceJournalDetail;
