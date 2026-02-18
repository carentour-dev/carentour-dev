"use client";

import { FinanceWorkspace } from "@/components/finance/FinanceWorkspace";

export default function AdminFinanceWorkspacePage() {
  return <FinanceWorkspace invoiceDetailsBasePath="/admin/finance" />;
}
