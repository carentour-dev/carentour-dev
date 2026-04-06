"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  FINANCE_APPROVAL_ENTITY_TYPES,
  FINANCE_APPROVAL_STATUSES,
  formatApprovalEntityType,
  resolveApprovalDecisionEndpoint,
  toApprovalQueueRowModel,
  type FinanceApprovalQueueApiRow,
  type FinanceApprovalQueueRowModel,
  type FinanceApprovalStatus,
} from "@/lib/finance/adminConsoles";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WorkspaceMetricCard,
  WorkspacePageHeader,
} from "@/components/workspaces/WorkspacePrimitives";

type FinanceApprovalsConsoleProps = {
  workspaceBasePath: string;
};

type QueueStatusFilter = FinanceApprovalStatus | "all";
type QueueEntityFilter = (typeof FINANCE_APPROVAL_ENTITY_TYPES)[number] | "all";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const statusBadgeVariant = (status: string) => {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "destructive" as const;
  if (status === "pending") return "secondary" as const;
  if (status === "cancelled") return "outline" as const;
  return "default" as const;
};

export function FinanceApprovalsConsole({
  workspaceBasePath,
}: FinanceApprovalsConsoleProps) {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const invalidateFinance = useFinanceInvalidate();

  const capabilities = useMemo(
    () => resolveFinanceCapabilities(profile?.permissions, profile?.roles),
    [profile?.permissions, profile?.roles],
  );

  const canViewQueue = capabilities.canViewApprovalsConsole;
  const canDecide = capabilities.canDecideApprovals;

  const [statusFilter, setStatusFilter] =
    useState<QueueStatusFilter>("pending");
  const [entityFilter, setEntityFilter] = useState<QueueEntityFilter>("all");
  const [decisionNotesById, setDecisionNotesById] = useState<
    Record<string, string>
  >({});

  const approvalsQueryKey = useMemo(
    () => ["finance", "approvals-console", statusFilter, entityFilter] as const,
    [entityFilter, statusFilter],
  );

  const approvalsQuery = useQuery({
    queryKey: approvalsQueryKey,
    enabled: canViewQueue,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (entityFilter !== "all") {
        params.set("entityType", entityFilter);
      }
      const query = params.toString();
      const rows = await adminFetch<FinanceApprovalQueueApiRow[]>(
        `/api/admin/finance/approval-requests${query ? `?${query}` : ""}`,
      );
      return rows.map(toApprovalQueueRowModel);
    },
    staleTime: 15_000,
  });

  const decisionMutation = useMutation({
    mutationFn: async (input: {
      row: FinanceApprovalQueueRowModel;
      status: "approved" | "rejected";
      decisionNotes?: string;
    }) => {
      const endpoint = resolveApprovalDecisionEndpoint({
        requestId: input.row.id,
        entityType: input.row.entityType,
        entityId: input.row.entityId,
      });

      return adminFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          status: input.status,
          decisionNotes: input.decisionNotes?.trim() || undefined,
        }),
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: approvalsQueryKey });
      const previousRows =
        queryClient.getQueryData<FinanceApprovalQueueRowModel[]>(
          approvalsQueryKey,
        );

      queryClient.setQueryData<FinanceApprovalQueueRowModel[]>(
        approvalsQueryKey,
        (rows) => {
          if (!rows) {
            return rows;
          }

          const updatedRows = rows.map((row) => {
            if (row.id !== input.row.id) {
              return row;
            }

            return {
              ...row,
              status: input.status,
              decisionNotes: input.decisionNotes?.trim() || row.decisionNotes,
              decidedAt: new Date().toISOString(),
            };
          });

          if (statusFilter !== "all") {
            return updatedRows.filter((row) => row.status === statusFilter);
          }

          return updatedRows;
        },
      );

      return { previousRows };
    },
    onError: (error, _input, context) => {
      if (context?.previousRows) {
        queryClient.setQueryData(approvalsQueryKey, context.previousRows);
      }
      toast({
        title: "Unable to record decision",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      invalidateFinance();
      toast({
        title: "Decision recorded",
        description: "Approval status has been updated.",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: approvalsQueryKey });
    },
  });

  const queueRows = approvalsQuery.data ?? [];
  const pendingCount = queueRows.filter(
    (row) => row.status === "pending",
  ).length;

  if (!canViewQueue) {
    return (
      <div className="space-y-8">
        <WorkspacePageHeader
          breadcrumb="Finance / Approvals"
          title="Finance Approval Console"
          subtitle="Centralized queue for payables, payable payment groups, and credit adjustment approvals."
        />

        <Card className="border-border/80 bg-muted/20">
          <CardHeader>
            <CardTitle>Approvals access is required</CardTitle>
            <CardDescription>
              Your role cannot view this queue. Open the main finance workspace
              at {workspaceBasePath} for the capabilities currently assigned to
              your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Finance / Approvals"
        title="Finance Approval Console"
        subtitle="Review and decide finance approval requests from one queue."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WorkspaceMetricCard
          label="Queue size"
          value={queueRows.length}
          helperText="Approval requests matching the current filter set."
        />
        <WorkspaceMetricCard
          label="Pending in current view"
          value={pendingCount}
          helperText="Requests still awaiting a finance decision."
          emphasisTone="warning"
        />
        <WorkspaceMetricCard
          label="Decision mode"
          value={canDecide ? "Approve / reject" : "Read-only"}
          valueDensity="compact"
          helperText="Current action capability for approval items."
          emphasisTone={canDecide ? "success" : "muted"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter by request status and entity type.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as QueueStatusFilter)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {FINANCE_APPROVAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {humanizeFinanceLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Entity type</Label>
            <Select
              value={entityFilter}
              onValueChange={(value) =>
                setEntityFilter(value as QueueEntityFilter)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {FINANCE_APPROVAL_ENTITY_TYPES.map((entityType) => (
                  <SelectItem key={entityType} value={entityType}>
                    {formatApprovalEntityType(entityType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end lg:col-span-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => approvalsQuery.refetch()}
              disabled={approvalsQuery.isFetching}
            >
              {approvalsQuery.isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh queue
            </Button>
          </div>
        </CardContent>
      </Card>

      {!canDecide ? (
        <Card className="border-border/70 bg-muted/15">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You have queue visibility without decision permissions. Requests are
            displayed in read-only mode.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>
            Includes request metadata, amount/currency, notes, and IDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvalsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading approval requests...
            </div>
          ) : null}

          {approvalsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Unable to load approvals queue. Retry in a moment.
            </div>
          ) : null}

          {!approvalsQuery.isLoading &&
          !approvalsQuery.isError &&
          queueRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approval requests match the selected filters.
            </p>
          ) : null}

          {queueRows.map((row) => {
            const noteValue = decisionNotesById[row.id] ?? "";
            const canDecideRow = canDecide && row.status === "pending";

            return (
              <div
                key={row.id}
                className="space-y-3 rounded-lg border border-border/70 bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {humanizeFinanceLabel(row.action)} -{" "}
                      {formatApprovalEntityType(row.entityType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDateTime(row.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(row.status)}>
                    {humanizeFinanceLabel(row.status)}
                  </Badge>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
                  <p>Request ID: {row.id}</p>
                  <p>Entity ID: {row.entityId}</p>
                  <p>
                    Amount:{" "}
                    {typeof row.amount === "number"
                      ? formatCurrency(row.amount, row.currency ?? "USD")
                      : "-"}
                  </p>
                  <p>Currency: {row.currency ?? "-"}</p>
                  <p>Reason: {row.reason || "-"}</p>
                  <p>Decided at: {formatDateTime(row.decidedAt)}</p>
                </div>

                {row.decisionNotes ? (
                  <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    Decision notes: {row.decisionNotes}
                  </p>
                ) : null}

                {canDecideRow ? (
                  <div className="space-y-2">
                    <Label htmlFor={`decision-notes-${row.id}`}>
                      Decision notes (optional)
                    </Label>
                    <Textarea
                      id={`decision-notes-${row.id}`}
                      rows={2}
                      value={noteValue}
                      onChange={(event) =>
                        setDecisionNotesById((prev) => ({
                          ...prev,
                          [row.id]: event.target.value,
                        }))
                      }
                      placeholder="Add a brief decision rationale"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          decisionMutation.mutate({
                            row,
                            status: "rejected",
                            decisionNotes: noteValue,
                          })
                        }
                        disabled={decisionMutation.isPending}
                      >
                        {decisionMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          decisionMutation.mutate({
                            row,
                            status: "approved",
                            decisionNotes: noteValue,
                          })
                        }
                        disabled={decisionMutation.isPending}
                      >
                        {decisionMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
