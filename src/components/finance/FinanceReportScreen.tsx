"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, Loader2 } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import {
  buildCsvContent,
  buildReportQueryParams,
  getNextSortState,
  REPORT_KIND_ENDPOINTS,
  REPORT_KIND_META,
  sortReportRows,
  type ReportExportRow,
  type ReportFilterState,
  type ReportKind,
  type ReportSortState,
} from "@/lib/finance/reportAnalytics";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkspacePageHeader } from "@/components/workspaces/WorkspacePrimitives";

type FinanceReportScreenProps = {
  report: ReportKind;
};

type AgingBucket = "current" | "1_30" | "31_60" | "61_90" | "90_plus";

type AgingRow = {
  payableId?: string;
  payableNumber?: string;
  counterpartyId?: string | null;
  counterpartyName?: string | null;
  invoiceId?: string;
  invoiceNumber?: string | null;
  patientId?: string | null;
  installmentId?: string | null;
  installmentLabel?: string | null;
  dueDate: string;
  balanceAmount: number;
  currency: string;
  daysPastDue: number;
  bucket: AgingBucket;
  status?: string;
};

type AgingReportPayload = {
  asOfDate: string;
  totalAmount: number;
  totalsByCurrency: Record<string, number>;
  buckets: Record<
    AgingBucket,
    {
      amount: number;
      count: number;
      byCurrency: Record<string, number>;
    }
  >;
  rows: AgingRow[];
};

type AccountRow = {
  accountCode: string;
  name: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
};

type TrialBalancePayload = {
  baseCurrency: string;
  dateFrom: string | null;
  dateTo: string | null;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  accounts: AccountRow[];
};

type ProfitLossPayload = {
  baseCurrency: string;
  dateFrom: string | null;
  dateTo: string | null;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  otherNet: number;
  operatingProfit: number;
  netIncome: number;
  accounts: AccountRow[];
};

type BalanceSheetPayload = {
  baseCurrency: string;
  asOfDate: string | null;
  assets: number;
  liabilities: number;
  equity: number;
  retainedEarnings: number;
  equityWithEarnings: number;
  liabilitiesAndEquity: number;
  difference: number;
  balanced: boolean;
  accounts: AccountRow[];
};

type PayablesDueCalendarPayload = {
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
};

const AGING_BUCKET_OPTIONS: Array<{ value: AgingBucket; label: string }> = [
  { value: "current", label: "Current" },
  { value: "1_30", label: "1-30 Days" },
  { value: "31_60", label: "31-60 Days" },
  { value: "61_90", label: "61-90 Days" },
  { value: "90_plus", label: "90+ Days" },
];

const EMPTY_AGING_ROWS: AgingRow[] = [];
const EMPTY_ACCOUNT_ROWS: AccountRow[] = [];

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

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

const formatAgingBucket = (bucket: AgingBucket) => {
  const found = AGING_BUCKET_OPTIONS.find((option) => option.value === bucket);
  return found?.label ?? bucket;
};

const downloadCsvFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const getDefaultSort = (report: ReportKind): ReportSortState => {
  if (report === "ap-aging" || report === "ar-aging") {
    return { key: "daysPastDue", direction: "desc" };
  }

  return { key: "accountCode", direction: "asc" };
};

const safeText = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const formatAppliedQuery = (queryString: string) => {
  if (!queryString) {
    return "none";
  }

  const params = new URLSearchParams(queryString);
  const parts: string[] = [];

  for (const [key, value] of params.entries()) {
    parts.push(`${humanizeFinanceLabel(key)}=${value}`);
  }

  return parts.join(" | ");
};

export function FinanceReportScreen({ report }: FinanceReportScreenProps) {
  const { toast } = useToast();

  const [asOfDate, setAsOfDate] = useState<string>(todayDateOnly());
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>(todayDateOnly());
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [sortState, setSortState] = useState<ReportSortState>(
    getDefaultSort(report),
  );

  useEffect(() => {
    setCurrencyFilter("all");
    setBucketFilter("all");
    setAccountTypeFilter("all");
    setQuery("");
    setSortState(getDefaultSort(report));

    if (report === "ap-aging" || report === "ar-aging") {
      setAsOfDate(todayDateOnly());
    }

    if (report === "balance-sheet") {
      setDateTo(todayDateOnly());
      setDateFrom("");
    }

    if (report === "trial-balance" || report === "profit-loss") {
      setDateTo(todayDateOnly());
    }
  }, [report]);

  const reportFilters = useMemo<ReportFilterState>(
    () => ({
      asOfDate,
      dateFrom,
      dateTo,
    }),
    [asOfDate, dateFrom, dateTo],
  );

  const reportQueryString = useMemo(
    () => buildReportQueryParams(report, reportFilters),
    [report, reportFilters],
  );

  const reportQuery = useQuery({
    queryKey: ["finance", "reports", report, reportQueryString],
    queryFn: () =>
      adminFetch<Record<string, unknown>>(
        `${REPORT_KIND_ENDPOINTS[report]}${reportQueryString ? `?${reportQueryString}` : ""}`,
      ),
    staleTime: 30_000,
  });

  const dueCalendarQuery = useQuery({
    queryKey: ["finance", "reports", "payables-due-calendar"],
    queryFn: () =>
      adminFetch<PayablesDueCalendarPayload>(
        "/api/admin/finance/reports/payables-due-calendar",
      ),
    enabled: report === "ap-aging",
    staleTime: 30_000,
  });

  const payload = reportQuery.data ?? ({} as Record<string, unknown>);
  const summaryGridClassName =
    report === "profit-loss"
      ? "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      : "grid gap-3 md:grid-cols-2 xl:grid-cols-3";

  const agingPayload =
    report === "ap-aging" || report === "ar-aging"
      ? (payload as AgingReportPayload)
      : null;

  const accountPayload =
    report === "trial-balance"
      ? (payload as TrialBalancePayload)
      : report === "profit-loss"
        ? (payload as ProfitLossPayload)
        : report === "balance-sheet"
          ? (payload as BalanceSheetPayload)
          : null;

  const rawAgingRows = agingPayload?.rows ?? EMPTY_AGING_ROWS;
  const rawAccountRows = accountPayload?.accounts ?? EMPTY_ACCOUNT_ROWS;

  const currencyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rawAgingRows.map((row) => (row.currency || "EGP").toUpperCase()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rawAgingRows],
  );

  const accountTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rawAccountRows
            .map((row) => row.accountType)
            .filter((value): value is string => typeof value === "string"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rawAccountRows],
  );

  const filteredAgingRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rawAgingRows.filter((row) => {
      if (
        currencyFilter !== "all" &&
        row.currency.toUpperCase() !== currencyFilter
      ) {
        return false;
      }

      if (bucketFilter !== "all" && row.bucket !== bucketFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const tokens = [
        row.payableNumber,
        row.counterpartyName,
        row.invoiceNumber,
        row.installmentLabel,
        row.patientId,
        row.currency,
        row.status,
      ]
        .map(safeText)
        .filter((value) => value.length > 0);

      return tokens.some((token) => token.includes(normalizedQuery));
    });
  }, [rawAgingRows, currencyFilter, bucketFilter, query]);

  const sortedAgingRows = useMemo(
    () =>
      sortReportRows(
        filteredAgingRows.map((row) => ({
          ...row,
          currency: row.currency.toUpperCase(),
          rowLabel:
            row.payableNumber ||
            row.invoiceNumber ||
            row.installmentLabel ||
            row.invoiceId ||
            row.payableId ||
            "-",
        })),
        sortState,
      ),
    [filteredAgingRows, sortState],
  );

  const filteredAccountRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rawAccountRows.filter((row) => {
      if (
        accountTypeFilter !== "all" &&
        safeText(row.accountType) !== safeText(accountTypeFilter)
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [row.accountCode, row.name, row.accountType]
        .map(safeText)
        .some((token) => token.includes(normalizedQuery));
    });
  }, [rawAccountRows, accountTypeFilter, query]);

  const sortedAccountRows = useMemo(
    () => sortReportRows(filteredAccountRows, sortState),
    [filteredAccountRows, sortState],
  );

  const exportRows = useMemo<ReportExportRow[]>(() => {
    if (report === "ap-aging" || report === "ar-aging") {
      return sortedAgingRows.map((row) => ({
        reference:
          row.payableNumber || row.invoiceNumber || row.invoiceId || "-",
        counterpart:
          row.counterpartyName || row.installmentLabel || row.patientId || "-",
        dueDate: row.dueDate,
        currency: row.currency,
        amount: row.balanceAmount,
        daysPastDue: row.daysPastDue,
        bucket: row.bucket,
        status: row.status ?? "-",
      }));
    }

    return sortedAccountRows.map((row) => ({
      accountCode: row.accountCode,
      accountName: row.name,
      accountType: row.accountType,
      debit: row.debit,
      credit: row.credit,
      balance: row.balance,
    }));
  }, [report, sortedAgingRows, sortedAccountRows]);

  const handleExportCsv = () => {
    if (exportRows.length === 0) {
      toast({
        title: "No rows to export",
        description: "Adjust filters or refresh the report.",
      });
      return;
    }

    const csv = buildCsvContent(exportRows);
    if (!csv) {
      toast({
        title: "No rows to export",
        description: "Adjust filters or refresh the report.",
      });
      return;
    }

    downloadCsvFile(`finance-${report}-${todayDateOnly()}.csv`, csv);
  };

  const renderSortButton = (key: string, label: string) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-1 py-0 text-left font-medium text-muted-foreground"
      onClick={() => setSortState((prev) => getNextSortState(prev, key))}
    >
      {label}
      {sortState.key === key ? (
        sortState.direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : null}
    </Button>
  );

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

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Finance / Reports"
        title={REPORT_KIND_META[report].title}
        subtitle={REPORT_KIND_META[report].description}
      />

      <Card>
        <CardHeader>
          <CardTitle>Analytics filters</CardTitle>
          <CardDescription>
            Filter, sort, and export rows based on current report context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(report === "ap-aging" || report === "ar-aging") && (
              <div className="space-y-2">
                <Label>As of date</Label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(event) => setAsOfDate(event.target.value)}
                />
              </div>
            )}

            {(report === "trial-balance" || report === "profit-loss") && (
              <>
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
              </>
            )}

            {report === "balance-sheet" && (
              <div className="space-y-2">
                <Label>As of date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>
            )}

            {(report === "ap-aging" || report === "ar-aging") && (
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={currencyFilter}
                  onValueChange={setCurrencyFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(report === "ap-aging" || report === "ar-aging") && (
              <div className="space-y-2">
                <Label>Aging bucket</Label>
                <Select value={bucketFilter} onValueChange={setBucketFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buckets</SelectItem>
                    {AGING_BUCKET_OPTIONS.map((bucket) => (
                      <SelectItem key={bucket.value} value={bucket.value}>
                        {bucket.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(report === "trial-balance" ||
              report === "profit-loss" ||
              report === "balance-sheet") && (
              <div className="space-y-2">
                <Label>Account type</Label>
                <Select
                  value={accountTypeFilter}
                  onValueChange={setAccountTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Account Types</SelectItem>
                    {accountTypeOptions.map((accountType) => (
                      <SelectItem key={accountType} value={accountType}>
                        {humanizeFinanceLabel(accountType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find by reference, account, status..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Badge variant="outline">{exportRows.length} row(s)</Badge>
            <Badge variant="secondary">
              Applied query: {formatAppliedQuery(reportQueryString)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Snapshot generated from posted ledger and AP/AR transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className={summaryGridClassName}>
          {report === "ap-aging" || report === "ar-aging" ? (
            <>
              <MetricCard
                label="As of"
                value={formatDate(String(agingPayload?.asOfDate ?? ""))}
              />
              <MetricCard
                label="Outstanding by currency"
                value={formatCurrencyBreakdown(
                  agingPayload?.totalsByCurrency as Record<string, number>,
                )}
              />
              <MetricCard
                label="Rows"
                value={String(
                  Array.isArray(agingPayload?.rows)
                    ? agingPayload.rows.length
                    : 0,
                )}
              />
            </>
          ) : null}

          {report === "trial-balance" ? (
            <>
              <MetricCard
                label="Base currency"
                value={String(
                  (payload as TrialBalancePayload).baseCurrency ?? "EGP",
                )}
              />
              <MetricCard
                label="Total debits"
                value={formatCurrency(
                  Number((payload as TrialBalancePayload).totalDebit ?? 0),
                  String(
                    (payload as TrialBalancePayload).baseCurrency ?? "EGP",
                  ),
                )}
              />
              <MetricCard
                label="Total credits"
                value={formatCurrency(
                  Number((payload as TrialBalancePayload).totalCredit ?? 0),
                  String(
                    (payload as TrialBalancePayload).baseCurrency ?? "EGP",
                  ),
                )}
              />
            </>
          ) : null}

          {report === "profit-loss" ? (
            <>
              <MetricCard
                label="Revenue"
                value={formatCurrency(
                  Number((payload as ProfitLossPayload).revenue ?? 0),
                  String((payload as ProfitLossPayload).baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="COGS / Costs"
                value={formatCurrency(
                  Number((payload as ProfitLossPayload).cogs ?? 0),
                  String((payload as ProfitLossPayload).baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Expenses"
                value={formatCurrency(
                  Number((payload as ProfitLossPayload).expenses ?? 0),
                  String((payload as ProfitLossPayload).baseCurrency ?? "EGP"),
                )}
              />
              <MetricCard
                label="Net income"
                value={formatCurrency(
                  Number((payload as ProfitLossPayload).netIncome ?? 0),
                  String((payload as ProfitLossPayload).baseCurrency ?? "EGP"),
                )}
              />
            </>
          ) : null}

          {report === "balance-sheet" ? (
            <>
              <MetricCard
                label="Assets"
                value={formatCurrency(
                  Number((payload as BalanceSheetPayload).assets ?? 0),
                  String(
                    (payload as BalanceSheetPayload).baseCurrency ?? "EGP",
                  ),
                )}
              />
              <MetricCard
                label="Liabilities"
                value={formatCurrency(
                  Number((payload as BalanceSheetPayload).liabilities ?? 0),
                  String(
                    (payload as BalanceSheetPayload).baseCurrency ?? "EGP",
                  ),
                )}
              />
              <MetricCard
                label="Equity + earnings"
                value={formatCurrency(
                  Number(
                    (payload as BalanceSheetPayload).equityWithEarnings ?? 0,
                  ),
                  String(
                    (payload as BalanceSheetPayload).baseCurrency ?? "EGP",
                  ),
                )}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {(report === "ap-aging" || report === "ar-aging") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {report === "ap-aging" ? "AP" : "AR"} aging rows
            </CardTitle>
            <CardDescription>
              Sorted and filtered rows used for aging analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedAgingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rows match the current filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {renderSortButton("rowLabel", "Reference")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton(
                        "counterpartyName",
                        "Counterparty / Installment",
                      )}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("dueDate", "Due date")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("currency", "Currency")}
                    </TableHead>
                    <TableHead className="text-right">
                      {renderSortButton("balanceAmount", "Amount")}
                    </TableHead>
                    <TableHead className="text-right">
                      {renderSortButton("daysPastDue", "Days past due")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("bucket", "Bucket")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAgingRows.map((row) => (
                    <TableRow
                      key={`${row.payableId || row.invoiceId}-${row.installmentId || row.dueDate}`}
                    >
                      <TableCell>
                        {row.payableNumber ||
                          row.invoiceNumber ||
                          row.invoiceId ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row.counterpartyName ||
                          row.installmentLabel ||
                          row.patientId ||
                          "-"}
                      </TableCell>
                      <TableCell>{formatDate(row.dueDate)}</TableCell>
                      <TableCell>{row.currency}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.balanceAmount, row.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.daysPastDue}
                      </TableCell>
                      <TableCell>{formatAgingBucket(row.bucket)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {(report === "trial-balance" ||
        report === "profit-loss" ||
        report === "balance-sheet") && (
        <Card>
          <CardHeader>
            <CardTitle>Account rollup</CardTitle>
            <CardDescription>
              Account-level contribution for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedAccountRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No account rows match the current filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {renderSortButton("accountCode", "Code")}
                    </TableHead>
                    <TableHead>{renderSortButton("name", "Account")}</TableHead>
                    <TableHead>
                      {renderSortButton("accountType", "Type")}
                    </TableHead>
                    <TableHead className="text-right">
                      {renderSortButton("debit", "Debit")}
                    </TableHead>
                    <TableHead className="text-right">
                      {renderSortButton("credit", "Credit")}
                    </TableHead>
                    <TableHead className="text-right">
                      {renderSortButton("balance", "Balance")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAccountRows.map((row) => (
                    <TableRow key={row.accountCode}>
                      <TableCell>{row.accountCode}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {humanizeFinanceLabel(row.accountType)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          row.debit,
                          String(accountPayload?.baseCurrency ?? "EGP"),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          row.credit,
                          String(accountPayload?.baseCurrency ?? "EGP"),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          row.balance,
                          String(accountPayload?.baseCurrency ?? "EGP"),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

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
                  {formatDate(row.dueDate)} • {humanizeFinanceLabel(row.status)}
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
            Structured API output for finance analysis and troubleshooting.
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
