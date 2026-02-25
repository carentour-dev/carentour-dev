export type ReportKind =
  | "ap-aging"
  | "ar-aging"
  | "trial-balance"
  | "profit-loss"
  | "balance-sheet";

type ReportKindMeta = {
  endpoint: string;
  title: string;
  description: string;
};

export const REPORT_KIND_META: Record<ReportKind, ReportKindMeta> = {
  "ap-aging": {
    endpoint: "/api/admin/finance/reports/ap-aging",
    title: "AP Aging",
    description: "Outstanding supplier balances bucketed by overdue age.",
  },
  "ar-aging": {
    endpoint: "/api/admin/finance/reports/ar-aging",
    title: "AR Aging",
    description:
      "Installment-level receivable exposure bucketed by overdue age.",
  },
  "trial-balance": {
    endpoint: "/api/admin/finance/reports/trial-balance",
    title: "Trial Balance",
    description: "Debit/credit rollup by chart account in base currency.",
  },
  "profit-loss": {
    endpoint: "/api/admin/finance/reports/profit-loss",
    title: "Profit & Loss",
    description: "Revenue, COGS/costs, expenses, and net income summary.",
  },
  "balance-sheet": {
    endpoint: "/api/admin/finance/reports/balance-sheet",
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity position as of date.",
  },
};

export const REPORT_KIND_ENDPOINTS: Record<ReportKind, string> = {
  "ap-aging": REPORT_KIND_META["ap-aging"].endpoint,
  "ar-aging": REPORT_KIND_META["ar-aging"].endpoint,
  "trial-balance": REPORT_KIND_META["trial-balance"].endpoint,
  "profit-loss": REPORT_KIND_META["profit-loss"].endpoint,
  "balance-sheet": REPORT_KIND_META["balance-sheet"].endpoint,
};

export const REPORT_KIND_TITLES: Record<ReportKind, string> = {
  "ap-aging": REPORT_KIND_META["ap-aging"].title,
  "ar-aging": REPORT_KIND_META["ar-aging"].title,
  "trial-balance": REPORT_KIND_META["trial-balance"].title,
  "profit-loss": REPORT_KIND_META["profit-loss"].title,
  "balance-sheet": REPORT_KIND_META["balance-sheet"].title,
};

export type ReportFilterState = {
  asOfDate?: string;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  bucket?: string;
  query?: string;
  accountType?: string;
  sourceType?: string;
};

export type ReportSortState = {
  key: string;
  direction: "asc" | "desc";
};

export type ReportExportRow = Record<
  string,
  string | number | boolean | null | undefined
>;

const isDateLikeString = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return true;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return true;
  }

  return false;
};

const normalizeSortValue = (value: unknown): number | string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (isDateLikeString(trimmed)) {
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && trimmed !== "") {
      return numeric;
    }

    return trimmed.toLowerCase();
  }

  return String(value).toLowerCase();
};

export const getNextSortState = (
  current: ReportSortState | null | undefined,
  key: string,
): ReportSortState => {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }

  return {
    key,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
};

export const sortReportRows = <T extends Record<string, unknown>>(
  rows: T[],
  sortState: ReportSortState | null | undefined,
) => {
  if (!sortState?.key) {
    return [...rows];
  }

  const multiplier = sortState.direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = normalizeSortValue(a[sortState.key]);
    const right = normalizeSortValue(b[sortState.key]);

    if (left === null && right === null) {
      return 0;
    }
    if (left === null) {
      return 1;
    }
    if (right === null) {
      return -1;
    }

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * multiplier;
    }

    return String(left).localeCompare(String(right)) * multiplier;
  });
};

const escapeCsvCell = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsvContent = (
  rows: ReportExportRow[],
  columns?: string[],
): string => {
  if (rows.length === 0) {
    return "";
  }

  const resolvedColumns =
    Array.isArray(columns) && columns.length > 0
      ? columns
      : Object.keys(rows[0] ?? {});

  const header = resolvedColumns.map(escapeCsvCell).join(",");
  const lines = rows.map((row) =>
    resolvedColumns
      .map((column) => {
        const value = row[column];
        if (value === null || value === undefined) {
          return "";
        }
        return escapeCsvCell(String(value));
      })
      .join(","),
  );

  return [header, ...lines].join("\n");
};

const addParam = (
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length > 0) {
    params.set(key, normalized);
  }
};

export const buildReportQueryParams = (
  report: ReportKind,
  filters: ReportFilterState,
) => {
  const params = new URLSearchParams();

  if (report === "ap-aging" || report === "ar-aging") {
    addParam(params, "asOfDate", filters.asOfDate);
  }

  if (report === "trial-balance" || report === "profit-loss") {
    addParam(params, "dateFrom", filters.dateFrom);
    addParam(params, "dateTo", filters.dateTo);
  }

  if (report === "balance-sheet") {
    addParam(params, "dateTo", filters.dateTo);
  }

  return params.toString();
};
