import assert from "node:assert/strict";
import {
  buildCsvContent,
  buildReportQueryParams,
  getNextSortState,
  sortReportRows,
  type ReportSortState,
} from "../src/lib/finance/reportAnalytics.ts";

assert.equal(
  buildReportQueryParams("ap-aging", { asOfDate: "2026-02-24" }),
  "asOfDate=2026-02-24",
);
assert.equal(
  buildReportQueryParams("ar-aging", { asOfDate: "2026-02-24" }),
  "asOfDate=2026-02-24",
);
assert.equal(
  buildReportQueryParams("trial-balance", {
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  }),
  "dateFrom=2026-01-01&dateTo=2026-01-31",
);
assert.equal(
  buildReportQueryParams("profit-loss", {
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  }),
  "dateFrom=2026-01-01&dateTo=2026-01-31",
);
assert.equal(
  buildReportQueryParams("balance-sheet", {
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  }),
  "dateTo=2026-01-31",
);
assert.equal(buildReportQueryParams("balance-sheet", { dateTo: "" }), "");

const stringRows = [
  { accountCode: "2100" },
  { accountCode: "1100" },
  { accountCode: "3100" },
];
assert.deepEqual(
  sortReportRows(stringRows, { key: "accountCode", direction: "asc" }).map(
    (row) => row.accountCode,
  ),
  ["1100", "2100", "3100"],
);

const numericRows = [{ amount: 120 }, { amount: 35 }, { amount: 88 }];
assert.deepEqual(
  sortReportRows(numericRows, { key: "amount", direction: "desc" }).map(
    (row) => row.amount,
  ),
  [120, 88, 35],
);

const dateRows = [
  { dueDate: "2026-02-18" },
  { dueDate: "2026-01-10" },
  { dueDate: "2026-02-02" },
];
assert.deepEqual(
  sortReportRows(dateRows, { key: "dueDate", direction: "asc" }).map(
    (row) => row.dueDate,
  ),
  ["2026-01-10", "2026-02-02", "2026-02-18"],
);

const initialSort: ReportSortState = { key: "balanceAmount", direction: "asc" };
assert.deepEqual(getNextSortState(initialSort, "balanceAmount"), {
  key: "balanceAmount",
  direction: "desc",
});
assert.deepEqual(getNextSortState(initialSort, "daysPastDue"), {
  key: "daysPastDue",
  direction: "asc",
});

const csv = buildCsvContent(
  [
    {
      reference: "INV-1",
      note: 'Needs "review"',
      amount: 123.45,
      remark: "line,with,comma",
      extra: "multi\nline",
    },
  ],
  ["reference", "note", "amount", "remark", "extra"],
);
assert.equal(
  csv,
  [
    "reference,note,amount,remark,extra",
    'INV-1,"Needs ""review""",123.45,"line,with,comma","multi',
    'line"',
  ].join("\n"),
);

console.log("finance report analytics tests passed");
