"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, RefreshCw, Save, Wrench } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useFinanceInvalidate } from "@/components/finance/hooks/useFinanceInvalidate";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  buildFinanceSettingsPatch,
  createFinanceSettingsFormModel,
  FINANCE_SETTINGS_ACTIONS,
  FINANCE_SUPPORTED_CURRENCIES,
  hasFinanceSettingsPatchChanges,
  type FinanceSettingsApiModel,
  type FinanceSettingsFormModel,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FinanceSettingsConsoleProps = {
  workspaceBasePath: string;
};

type ChartAccount = {
  id: string;
  account_code: string;
  name: string;
  account_type: string;
  parent_account_id?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

type SyncResult = {
  mode: "dry_run" | "apply";
  sourceType: "all" | "service_provider" | "hotel";
  counters: {
    created: number;
    updated: number;
    deactivated: number;
    skipped: number;
    errors: number;
  };
  errors: Array<{
    sourceType: "service_provider" | "hotel";
    sourceId: string;
    message: string;
  }>;
  startedAt: string;
  finishedAt: string;
};

type SyncAuditRow = {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type ChartAccountFormState = {
  accountCode: string;
  name: string;
  accountType: string;
  parentAccountId: string;
  isActive: boolean;
};

type ChartAccountEditFormState = {
  name: string;
  accountType: string;
  parentAccountId: string;
  isActive: boolean;
  metadataText: string;
};

const CHART_ACCOUNT_TYPE_DEFAULTS = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
  "cogs",
  "other",
];
const NO_PARENT_VALUE = "__none__";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const normalizeAuditCounters = (
  payload?: Record<string, unknown>,
): SyncResult["counters"] | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const counters = payload.counters;
  if (!counters || typeof counters !== "object") {
    return null;
  }

  const record = counters as Record<string, unknown>;
  const parsed = {
    created: Number(record.created),
    updated: Number(record.updated),
    deactivated: Number(record.deactivated),
    skipped: Number(record.skipped),
    errors: Number(record.errors),
  };

  const valid = Object.values(parsed).every((value) => Number.isFinite(value));
  return valid ? parsed : null;
};

const metadataToJsonText = (metadata?: Record<string, unknown> | null) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "{}";
  }
  return JSON.stringify(metadata, null, 2);
};

const parseMetadataText = (metadataText: string): Record<string, unknown> => {
  const normalized = metadataText.trim();
  if (!normalized) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error("Metadata must be valid JSON.");
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Metadata must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
};

export function FinanceSettingsConsole({
  workspaceBasePath,
}: FinanceSettingsConsoleProps) {
  const { toast } = useToast();
  const invalidateFinance = useFinanceInvalidate();
  const { profile } = useUserProfile();

  const capabilities = useMemo(
    () => resolveFinanceCapabilities(profile?.permissions, profile?.roles),
    [profile?.permissions, profile?.roles],
  );

  const canViewSettings = capabilities.canViewSettingsConsole;
  const canManageSettings = capabilities.canManageSettings;
  const canRunCounterpartySync = capabilities.canRunCounterpartySync;
  const canRunLedgerBackfill = capabilities.canRunLedgerBackfill;

  const [form, setForm] = useState<FinanceSettingsFormModel | null>(null);
  const [syncSourceType, setSyncSourceType] = useState<
    "all" | "service_provider" | "hotel"
  >("all");
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [chartSearch, setChartSearch] = useState<string>("");
  const [chartActiveFilter, setChartActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [chartTypeFilter, setChartTypeFilter] = useState<string>("all");
  const [editingChartAccountId, setEditingChartAccountId] = useState<
    string | null
  >(null);
  const [createChartForm, setCreateChartForm] = useState<ChartAccountFormState>(
    {
      accountCode: "",
      name: "",
      accountType: "expense",
      parentAccountId: NO_PARENT_VALUE,
      isActive: true,
    },
  );
  const [editChartForm, setEditChartForm] = useState<ChartAccountEditFormState>(
    {
      name: "",
      accountType: "expense",
      parentAccountId: NO_PARENT_VALUE,
      isActive: true,
      metadataText: "{}",
    },
  );

  const settingsQuery = useQuery({
    queryKey: ["finance", "settings-console", "settings"],
    enabled: canManageSettings,
    queryFn: () =>
      adminFetch<FinanceSettingsApiModel>("/api/admin/finance/settings"),
    staleTime: 30_000,
  });

  const chartAccountsQuery = useQuery({
    queryKey: ["finance", "settings-console", "chart-accounts"],
    enabled: canManageSettings,
    queryFn: () =>
      adminFetch<ChartAccount[]>("/api/admin/finance/chart-accounts"),
    staleTime: 60_000,
  });

  const syncHistoryQuery = useQuery({
    queryKey: ["finance", "settings-console", "counterparty-sync-history"],
    enabled: canRunCounterpartySync,
    queryFn: () =>
      adminFetch<SyncAuditRow[]>(
        "/api/admin/finance/counterparties/reconcile?limit=5",
      ),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setForm(createFinanceSettingsFormModel(settingsQuery.data));
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!settingsQuery.data || !form) {
        throw new Error("Finance settings are not loaded yet.");
      }

      const patch = buildFinanceSettingsPatch({
        current: settingsQuery.data,
        draft: form,
      });

      if (!hasFinanceSettingsPatchChanges(patch)) {
        return null;
      }

      return adminFetch<FinanceSettingsApiModel>(
        "/api/admin/finance/settings",
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        },
      );
    },
    onSuccess: (result) => {
      if (!result) {
        toast({
          title: "No settings changes",
          description:
            "Thresholds and account mappings are already up to date.",
        });
        return;
      }

      invalidateFinance();
      setForm(createFinanceSettingsFormModel(result));
      toast({
        title: "Settings updated",
        description: "Finance policies were saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to update settings",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (mode: "dry_run" | "apply") => {
      const payload: Record<string, unknown> = { mode };
      if (syncSourceType !== "all") {
        payload.sourceType = syncSourceType;
      }

      return adminFetch<SyncResult>(
        "/api/admin/finance/counterparties/reconcile",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (result) => {
      setLastSyncResult(result);
      invalidateFinance();
      void syncHistoryQuery.refetch();
      toast({
        title:
          result.mode === "dry_run" ? "Sync preview completed" : "Sync applied",
        description: `Created ${result.counters.created}, updated ${result.counters.updated}, deactivated ${result.counters.deactivated}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Counterparty sync failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const backfillMutation = useMutation({
    mutationFn: () =>
      adminFetch<{
        invoices: number;
        payments: number;
        creditAdjustments: number;
        payables: number;
        payablePayments: number;
      }>("/api/admin/finance/journal-entries/backfill", {
        method: "POST",
      }),
    onSuccess: (result) => {
      invalidateFinance();
      toast({
        title: "Ledger backfill completed",
        description: `Invoices ${result.invoices}, payments ${result.payments}, payables ${result.payables}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ledger backfill failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeChartAccounts = useMemo(
    () =>
      (chartAccountsQuery.data ?? []).filter((account) => account.is_active),
    [chartAccountsQuery.data],
  );

  const chartAccountTypeOptions = useMemo(() => {
    const dynamicTypes = (chartAccountsQuery.data ?? [])
      .map((account) => account.account_type)
      .filter((value) => value.trim().length > 0);
    const customTypes = [createChartForm.accountType, editChartForm.accountType]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return Array.from(
      new Set([
        ...CHART_ACCOUNT_TYPE_DEFAULTS,
        ...dynamicTypes,
        ...customTypes,
      ]),
    ).sort((a, b) => a.localeCompare(b));
  }, [
    chartAccountsQuery.data,
    createChartForm.accountType,
    editChartForm.accountType,
  ]);

  const filteredChartAccounts = useMemo(() => {
    const normalizedSearch = chartSearch.trim().toLowerCase();

    return (chartAccountsQuery.data ?? []).filter((account) => {
      if (chartActiveFilter === "active" && !account.is_active) {
        return false;
      }

      if (chartActiveFilter === "inactive" && account.is_active) {
        return false;
      }

      if (
        chartTypeFilter !== "all" &&
        account.account_type.trim().toLowerCase() !==
          chartTypeFilter.trim().toLowerCase()
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        account.account_code.toLowerCase().includes(normalizedSearch) ||
        account.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [
    chartAccountsQuery.data,
    chartActiveFilter,
    chartTypeFilter,
    chartSearch,
  ]);

  const postingAccountKeys = useMemo(
    () =>
      Object.keys(form?.postingAccounts ?? {}).sort((a, b) =>
        a.localeCompare(b),
      ),
    [form?.postingAccounts],
  );

  const latestAuditRun = syncHistoryQuery.data?.[0] ?? null;
  const latestAuditCounters = useMemo(
    () => normalizeAuditCounters(latestAuditRun?.payload),
    [latestAuditRun?.payload],
  );

  const visibleCounters = lastSyncResult?.counters ?? latestAuditCounters;

  const handleThresholdChange = (
    action: (typeof FINANCE_SETTINGS_ACTIONS)[number],
    currency: (typeof FINANCE_SUPPORTED_CURRENCIES)[number],
    value: string,
  ) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        approvalThresholds: {
          ...prev.approvalThresholds,
          [action]: {
            ...prev.approvalThresholds[action],
            [currency]: value,
          },
        },
      };
    });
  };

  const handlePostingAccountChange = (key: string, value: string) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        postingAccounts: {
          ...prev.postingAccounts,
          [key]: value,
        },
      };
    });
  };

  const createChartAccountMutation = useMutation({
    mutationFn: async () => {
      if (!canManageSettings) {
        throw new Error("finance.settings permission is required.");
      }

      const accountCode = createChartForm.accountCode.trim();
      const name = createChartForm.name.trim();
      const accountType = createChartForm.accountType.trim();

      if (!accountCode) {
        throw new Error("Account code is required.");
      }

      if (!name) {
        throw new Error("Account name is required.");
      }

      if (!accountType) {
        throw new Error("Account type is required.");
      }

      return adminFetch<ChartAccount>("/api/admin/finance/chart-accounts", {
        method: "POST",
        body: JSON.stringify({
          accountCode,
          name,
          accountType,
          parentAccountId:
            createChartForm.parentAccountId === NO_PARENT_VALUE
              ? undefined
              : createChartForm.parentAccountId,
          isActive: createChartForm.isActive,
        }),
      });
    },
    onSuccess: () => {
      invalidateFinance();
      setCreateChartForm({
        accountCode: "",
        name: "",
        accountType: "expense",
        parentAccountId: NO_PARENT_VALUE,
        isActive: true,
      });
      toast({
        title: "Chart account created",
        description: "The chart account is now available for finance mapping.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create chart account",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateChartAccountMutation = useMutation({
    mutationFn: async () => {
      if (!canManageSettings) {
        throw new Error("finance.settings permission is required.");
      }
      if (!editingChartAccountId) {
        throw new Error("Select an account to edit.");
      }

      const name = editChartForm.name.trim();
      const accountType = editChartForm.accountType.trim();

      if (!name) {
        throw new Error("Account name is required.");
      }

      if (!accountType) {
        throw new Error("Account type is required.");
      }

      const metadata = parseMetadataText(editChartForm.metadataText);

      return adminFetch<ChartAccount>(
        `/api/admin/finance/chart-accounts/${editingChartAccountId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name,
            accountType,
            parentAccountId:
              editChartForm.parentAccountId === NO_PARENT_VALUE
                ? null
                : editChartForm.parentAccountId,
            isActive: editChartForm.isActive,
            metadata,
          }),
        },
      );
    },
    onSuccess: () => {
      invalidateFinance();
      setEditingChartAccountId(null);
      toast({
        title: "Chart account updated",
        description: "Account changes were saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update chart account",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const beginChartAccountEdit = (account: ChartAccount) => {
    setEditingChartAccountId(account.id);
    setEditChartForm({
      name: account.name,
      accountType: account.account_type,
      parentAccountId: account.parent_account_id ?? NO_PARENT_VALUE,
      isActive: account.is_active,
      metadataText: metadataToJsonText(account.metadata),
    });
  };

  if (!canViewSettings) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Finance Settings Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Centralized policy and maintenance controls for finance operations.
          </p>
        </header>

        <Card className="border-border/80 bg-muted/20">
          <CardHeader>
            <CardTitle>Settings access is required</CardTitle>
            <CardDescription>
              Your role cannot access this console. Use {workspaceBasePath} for
              permitted finance workflows.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Finance Settings Console
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage approval thresholds, posting-account mappings, and maintenance
          actions from a centralized workspace.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="border-b-0 pb-2">
            <CardDescription>Policy permissions</CardDescription>
            <CardTitle>{canManageSettings ? "Manage" : "Read-only"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 pb-2">
            <CardDescription>Active chart accounts</CardDescription>
            <CardTitle>{activeChartAccounts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 pb-2">
            <CardDescription>Latest sync run</CardDescription>
            <CardTitle className="text-base">
              {formatDateTime(latestAuditRun?.created_at)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {canManageSettings ? (
        <Card>
          <CardHeader>
            <CardTitle>Policy controls</CardTitle>
            <CardDescription>
              Update base currency, approval thresholds, and posting account
              mappings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settingsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading finance settings...
              </div>
            ) : null}

            {settingsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Unable to load finance settings. Retry in a moment.
              </div>
            ) : null}

            {chartAccountsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Unable to load chart accounts required for mapping.
              </div>
            ) : null}

            {form ? (
              <>
                <div className="space-y-2">
                  <Label>Base currency</Label>
                  <Select
                    value={form.baseCurrency}
                    onValueChange={(value) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              baseCurrency:
                                value as FinanceSettingsFormModel["baseCurrency"],
                            }
                          : prev,
                      )
                    }
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Approval thresholds</h3>
                    <p className="text-xs text-muted-foreground">
                      Threshold values must be non-negative and are saved per
                      action/currency.
                    </p>
                  </div>

                  {FINANCE_SETTINGS_ACTIONS.map((action) => (
                    <div
                      key={action}
                      className="space-y-3 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {humanizeFinanceLabel(action)}
                        </p>
                        <Badge variant="outline">Policy</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {FINANCE_SUPPORTED_CURRENCIES.map((currency) => (
                          <div
                            key={`${action}-${currency}`}
                            className="space-y-2"
                          >
                            <Label>{currency}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.approvalThresholds[action][currency]}
                              onChange={(event) =>
                                handleThresholdChange(
                                  action,
                                  currency,
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Posting accounts</h3>
                    <p className="text-xs text-muted-foreground">
                      Each mapping must resolve to a valid chart account code.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {postingAccountKeys.map((mappingKey) => {
                      const currentCode = form.postingAccounts[mappingKey];
                      const hasCurrentOption = activeChartAccounts.some(
                        (account) => account.account_code === currentCode,
                      );

                      const options = hasCurrentOption
                        ? activeChartAccounts
                        : [
                            ...activeChartAccounts,
                            {
                              id: `current-${mappingKey}`,
                              account_code: currentCode,
                              name: "Current mapping",
                              account_type: "custom",
                              is_active: false,
                            },
                          ];

                      return (
                        <div key={mappingKey} className="space-y-2">
                          <Label>{humanizeFinanceLabel(mappingKey)}</Label>
                          <Select
                            value={currentCode}
                            onValueChange={(value) =>
                              handlePostingAccountChange(mappingKey, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account code" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((account) => (
                                <SelectItem
                                  key={`${mappingKey}-${account.id}`}
                                  value={account.account_code}
                                >
                                  {account.account_code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={() => saveSettingsMutation.mutate()}
                    disabled={saveSettingsMutation.isPending}
                  >
                    {saveSettingsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save settings
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Chart Accounts</CardTitle>
          <CardDescription>
            Create and update chart accounts used by payable posting and
            reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {chartAccountsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading chart accounts...
            </div>
          ) : null}

          {chartAccountsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Unable to load chart accounts.
            </div>
          ) : null}

          {canManageSettings ? (
            <div className="space-y-4 rounded-lg border border-border/70 p-4">
              <div>
                <h3 className="text-sm font-medium">Create account</h3>
                <p className="text-xs text-muted-foreground">
                  Add a new account code for finance posting and analysis.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Account code</Label>
                  <Input
                    value={createChartForm.accountCode}
                    onChange={(event) =>
                      setCreateChartForm((prev) => ({
                        ...prev,
                        accountCode: event.target.value,
                      }))
                    }
                    placeholder="e.g. 5200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={createChartForm.name}
                    onChange={(event) =>
                      setCreateChartForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Provider expenses"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <Input
                    value={createChartForm.accountType}
                    onChange={(event) =>
                      setCreateChartForm((prev) => ({
                        ...prev,
                        accountType: event.target.value,
                      }))
                    }
                    placeholder="expense / asset / liability..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent account</Label>
                  <Select
                    value={createChartForm.parentAccountId}
                    onValueChange={(value) =>
                      setCreateChartForm((prev) => ({
                        ...prev,
                        parentAccountId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_VALUE}>
                        No parent account
                      </SelectItem>
                      {(chartAccountsQuery.data ?? []).map((account) => (
                        <SelectItem
                          key={`create-parent-${account.id}`}
                          value={account.id}
                        >
                          {account.account_code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Active</Label>
                  <div className="flex h-10 items-center">
                    <Switch
                      checked={createChartForm.isActive}
                      onCheckedChange={(checked) =>
                        setCreateChartForm((prev) => ({
                          ...prev,
                          isActive: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={() => createChartAccountMutation.mutate()}
                  disabled={createChartAccountMutation.isPending}
                >
                  {createChartAccountMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Create chart account
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chart account management is read-only for the current role.
            </p>
          )}

          {canManageSettings ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Search code or name</Label>
                  <Input
                    value={chartSearch}
                    onChange={(event) => setChartSearch(event.target.value)}
                    placeholder="Find account by code or name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active filter</Label>
                  <Select
                    value={chartActiveFilter}
                    onValueChange={(value) =>
                      setChartActiveFilter(
                        value as "all" | "active" | "inactive",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <Select
                    value={chartTypeFilter}
                    onValueChange={setChartTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {chartAccountTypeOptions.map((accountType) => (
                        <SelectItem
                          key={`type-filter-${accountType}`}
                          value={accountType}
                        >
                          {humanizeFinanceLabel(accountType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredChartAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No chart accounts match current filters.
                  </p>
                ) : null}

                {filteredChartAccounts.map((account) => {
                  const parent = (chartAccountsQuery.data ?? []).find(
                    (item) => item.id === account.parent_account_id,
                  );
                  const isEditing = editingChartAccountId === account.id;
                  const parentOptions = (chartAccountsQuery.data ?? []).filter(
                    (item) => item.id !== account.id,
                  );

                  return (
                    <div
                      key={account.id}
                      className="rounded-lg border border-border/70 bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {account.account_code} - {account.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Type: {humanizeFinanceLabel(account.account_type)} •{" "}
                            Parent:{" "}
                            {parent
                              ? `${parent.account_code} - ${parent.name}`
                              : "None"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={account.is_active ? "success" : "outline"}
                          >
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => beginChartAccountEdit(account)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-4 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={editChartForm.name}
                                onChange={(event) =>
                                  setEditChartForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Account type</Label>
                              <Input
                                value={editChartForm.accountType}
                                onChange={(event) =>
                                  setEditChartForm((prev) => ({
                                    ...prev,
                                    accountType: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Parent account</Label>
                              <Select
                                value={editChartForm.parentAccountId}
                                onValueChange={(value) =>
                                  setEditChartForm((prev) => ({
                                    ...prev,
                                    parentAccountId: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NO_PARENT_VALUE}>
                                    No parent account
                                  </SelectItem>
                                  {parentOptions.map((option) => (
                                    <SelectItem
                                      key={`edit-parent-${account.id}-${option.id}`}
                                      value={option.id}
                                    >
                                      {option.account_code} - {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Active</Label>
                              <div className="flex h-10 items-center">
                                <Switch
                                  checked={editChartForm.isActive}
                                  onCheckedChange={(checked) =>
                                    setEditChartForm((prev) => ({
                                      ...prev,
                                      isActive: checked,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Metadata (JSON object)</Label>
                              <Textarea
                                value={editChartForm.metadataText}
                                onChange={(event) =>
                                  setEditChartForm((prev) => ({
                                    ...prev,
                                    metadataText: event.target.value,
                                  }))
                                }
                                rows={4}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              onClick={() =>
                                updateChartAccountMutation.mutate()
                              }
                              disabled={updateChartAccountMutation.isPending}
                            >
                              {updateChartAccountMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save account
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingChartAccountId(null)}
                              disabled={updateChartAccountMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance actions</CardTitle>
          <CardDescription>
            Consolidated operational controls for counterparty sync and ledger
            maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canRunCounterpartySync ? (
            <div className="space-y-4 rounded-lg border border-border/70 p-4">
              <div>
                <h3 className="text-sm font-medium">Counterparty sync</h3>
                <p className="text-xs text-muted-foreground">
                  Run preview or apply sync from service providers and hotels.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>Source</Label>
                  <Select
                    value={syncSourceType}
                    onValueChange={(value) =>
                      setSyncSourceType(
                        value as "all" | "service_provider" | "hotel",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="service_provider">
                        Service Providers
                      </SelectItem>
                      <SelectItem value="hotel">Hotels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2 md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => syncMutation.mutate("dry_run")}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Preview sync
                  </Button>

                  {canManageSettings ? (
                    <Button
                      type="button"
                      onClick={() => syncMutation.mutate("apply")}
                      disabled={syncMutation.isPending}
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Apply sync
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Apply is available to settings-capable users.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last sync run
                  </p>
                  <p className="text-sm font-medium">
                    {formatDateTime(latestAuditRun?.created_at)}
                  </p>
                  {latestAuditRun ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {humanizeFinanceLabel(latestAuditRun.action)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Latest counters
                  </p>
                  <p className="text-sm font-medium">
                    {visibleCounters
                      ? `Created ${visibleCounters.created}, Updated ${visibleCounters.updated}, Deactivated ${visibleCounters.deactivated}`
                      : "-"}
                  </p>
                  {visibleCounters ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Skipped {visibleCounters.skipped} • Errors{" "}
                      {visibleCounters.errors}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {canRunLedgerBackfill ? (
            <div className="space-y-4 rounded-lg border border-border/70 p-4">
              <div>
                <h3 className="text-sm font-medium">Ledger backfill</h3>
                <p className="text-xs text-muted-foreground">
                  Trigger idempotent backfill for invoices, payments, payables,
                  and credit adjustments.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => backfillMutation.mutate()}
                disabled={backfillMutation.isPending}
              >
                {backfillMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="mr-2 h-4 w-4" />
                )}
                Run ledger backfill
              </Button>
            </div>
          ) : null}

          {!canRunCounterpartySync && !canRunLedgerBackfill ? (
            <p className="text-sm text-muted-foreground">
              No maintenance actions are available for the current role.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
