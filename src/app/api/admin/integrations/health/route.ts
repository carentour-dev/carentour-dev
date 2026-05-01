import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const LEADS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.leads"],
} as const;

export const GET = adminRoute(async () => {
  const supabase = getSupabaseAdmin() as any;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [deliveries, leads, automation] = await Promise.all([
    supabase
      .from("webhook_deliveries")
      .select("status, signature_valid, delivery_key, received_at")
      .gte("received_at", since),
    supabase.from("lead_inquiries").select("status, urgency_tier"),
    supabase
      .from("automation_runs")
      .select("review_state")
      .eq("review_state", "pending"),
  ]);

  const error = deliveries.error ?? leads.error ?? automation.error;
  if (error) {
    throw new ApiError(500, "Failed to load integration health", error.message);
  }

  const deliveryRows = deliveries.data ?? [];
  const leadRows = leads.data ?? [];

  return jsonResponse({
    deliveries24h: deliveryRows.length,
    rejected24h: deliveryRows.filter((row: any) => row.status === "rejected")
      .length,
    failed24h: deliveryRows.filter((row: any) => row.status === "failed")
      .length,
    invalidSignatures24h: deliveryRows.filter(
      (row: any) => row.signature_valid === false,
    ).length,
    idempotentDeliveries24h: deliveryRows.filter((row: any) =>
      Boolean(row.delivery_key),
    ).length,
    leadsByStatus: leadRows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {}),
    urgentOpenLeads: leadRows.filter(
      (row: any) =>
        row.urgency_tier === "urgent" &&
        !["converted", "archived", "disqualified"].includes(row.status),
    ).length,
    pendingAutomationReviews: (automation.data ?? []).length,
  });
}, LEADS_PERMISSIONS);
