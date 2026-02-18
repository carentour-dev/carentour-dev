"use client";

import { QuotationPrintView } from "@/components/operations/quotation-calculator/QuotationPrintView";

export default function FinanceQuotationPrintPage() {
  return (
    <QuotationPrintView
      apiBasePath="/api/admin/finance/quotation"
      queryScope="finance"
    />
  );
}
