"use client";

import { useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";

export const FINANCE_QUERY_KEY = ["finance"] as const;

export function useFinanceInvalidate() {
  const invalidate = useAdminInvalidate();

  return () => invalidate(FINANCE_QUERY_KEY);
}
