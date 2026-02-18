"use client";

import { QuotationCalculatorWorkspace } from "@/components/operations/quotation-calculator/QuotationCalculatorWorkspace";

export default function FinanceQuotationCalculatorPage() {
  return (
    <QuotationCalculatorWorkspace
      apiBasePath="/api/admin/finance/quotation"
      printBasePath="/finance/quotation-calculator"
    />
  );
}
