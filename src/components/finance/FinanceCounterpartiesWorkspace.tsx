"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import { ComboBox, type ComboOption } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUserProfile } from "@/hooks/useUserProfile";
import { resolveFinanceCapabilities } from "@/lib/finance/capabilities";
import { humanizeFinanceLabel } from "@/lib/finance/labels";

type Counterparty = {
  id: string;
  name: string;
  kind: string;
  source_type?: "manual" | "service_provider" | "hotel" | null;
  service_provider_id?: string | null;
  hotel_id?: string | null;
  is_active: boolean;
  external_code?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  last_synced_at?: string | null;
  created_at?: string;
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

type CounterpartyDeleteResult = {
  outcome: "deleted" | "deactivated" | "already_inactive";
  counterpartyId: string;
  referencedPayables: number;
};

type CounterpartyKindOption = {
  value: string;
  label: string;
};

const COUNTERPARTIES_QUERY_KEY = ["finance", "counterparties"] as const;
const COUNTERPARTIES_REGISTRY_QUERY_KEY = [
  ...COUNTERPARTIES_QUERY_KEY,
  "registry",
] as const;
const COUNTERPARTY_SYNC_HISTORY_QUERY_KEY = [
  "finance",
  "counterparties",
  "sync-history",
] as const;
const SEARCH_ALL_VALUE = "__all__";
const BASE_COUNTERPARTY_KIND_OPTIONS: CounterpartyKindOption[] = [
  { value: "vendor", label: "Vendor" },
  { value: "service_provider", label: "Service Provider" },
  { value: "hospital", label: "Hospital" },
  { value: "hotel", label: "Hotel" },
  { value: "insurance", label: "Insurance" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const sourceBadgeVariant = (
  sourceType?: "manual" | "service_provider" | "hotel" | null,
) => {
  if (sourceType === "service_provider" || sourceType === "hotel") {
    return "secondary" as const;
  }
  return "outline" as const;
};

const readAuditCounters = (
  payload?: Record<string, unknown> | null,
): SyncResult["counters"] | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const counters = payload.counters;
  if (!counters || typeof counters !== "object") {
    return null;
  }

  const record = counters as Record<string, unknown>;
  const created = Number(record.created);
  const updated = Number(record.updated);
  const deactivated = Number(record.deactivated);
  const skipped = Number(record.skipped);
  const errors = Number(record.errors);

  if (
    !Number.isFinite(created) ||
    !Number.isFinite(updated) ||
    !Number.isFinite(deactivated) ||
    !Number.isFinite(skipped) ||
    !Number.isFinite(errors)
  ) {
    return null;
  }

  return { created, updated, deactivated, skipped, errors };
};

const buildKindOptions = (currentValue?: string): CounterpartyKindOption[] => {
  const normalizedCurrent = currentValue?.trim().toLowerCase();

  if (
    !normalizedCurrent ||
    BASE_COUNTERPARTY_KIND_OPTIONS.some(
      (option) => option.value === normalizedCurrent,
    )
  ) {
    return BASE_COUNTERPARTY_KIND_OPTIONS;
  }

  return [
    ...BASE_COUNTERPARTY_KIND_OPTIONS,
    { value: normalizedCurrent, label: `${currentValue?.trim()} (custom)` },
  ];
};

export function FinanceCounterpartiesWorkspace() {
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();
  const { profile } = useUserProfile();
  const capabilities = useMemo(
    () => resolveFinanceCapabilities(profile?.permissions, profile?.roles),
    [profile?.permissions, profile?.roles],
  );
  const canViewCounterparties = capabilities.canViewCounterparties;
  const canManageCounterparties = capabilities.canManageCounterparties;
  const canRunSyncPreview = capabilities.canRunCounterpartySync;
  const canRunSyncApply = capabilities.canManageSettings;

  const [search, setSearch] = useState("");
  const [searchCounterpartyId, setSearchCounterpartyId] =
    useState<string>(SEARCH_ALL_VALUE);
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "manual" | "service_provider" | "hotel"
  >("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] =
    useState<Counterparty | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    kind: "vendor",
    externalCode: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    kind: "vendor",
    externalCode: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
  });

  const counterpartiesQuery = useQuery({
    queryKey: [
      ...COUNTERPARTIES_REGISTRY_QUERY_KEY,
      search,
      activeFilter,
      sourceFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim().length > 0) params.set("search", search.trim());
      if (activeFilter !== "all") params.set("isActive", activeFilter);
      if (sourceFilter !== "all") params.set("sourceType", sourceFilter);
      const query = params.toString();
      return adminFetch<Counterparty[]>(
        `/api/admin/finance/counterparties${query ? `?${query}` : ""}`,
      );
    },
    enabled: canViewCounterparties,
    staleTime: 30_000,
  });
  const counterpartySearchOptionsQuery = useQuery({
    queryKey: [
      ...COUNTERPARTIES_REGISTRY_QUERY_KEY,
      "search-options",
      activeFilter,
      sourceFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("isActive", activeFilter);
      if (sourceFilter !== "all") params.set("sourceType", sourceFilter);
      const query = params.toString();
      return adminFetch<Counterparty[]>(
        `/api/admin/finance/counterparties${query ? `?${query}` : ""}`,
      );
    },
    enabled: canViewCounterparties,
    staleTime: 30_000,
  });

  const syncHistoryQuery = useQuery({
    queryKey: COUNTERPARTY_SYNC_HISTORY_QUERY_KEY,
    queryFn: () =>
      adminFetch<SyncAuditRow[]>(
        "/api/admin/finance/counterparties/reconcile?limit=5",
      ),
    enabled: canRunSyncPreview,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!canManageCounterparties) {
        throw new Error("finance.counterparties permission is required.");
      }
      return adminFetch<Counterparty>("/api/admin/finance/counterparties", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name.trim(),
          kind: createForm.kind.trim(),
          externalCode: createForm.externalCode.trim() || undefined,
          contactEmail: createForm.contactEmail.trim() || undefined,
          contactPhone: createForm.contactPhone.trim() || undefined,
          isActive: createForm.isActive,
        }),
      });
    },
    onSuccess: () => {
      invalidate(COUNTERPARTIES_QUERY_KEY);
      setCreateOpen(false);
      setCreateForm({
        name: "",
        kind: "vendor",
        externalCode: "",
        contactEmail: "",
        contactPhone: "",
        isActive: true,
      });
      toast({
        title: "Counterparty created",
        description: "Counterparty was added to the registry.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create counterparty",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!canManageCounterparties) {
        throw new Error("finance.counterparties permission is required.");
      }
      if (!selectedCounterparty) {
        throw new Error("Counterparty is not selected.");
      }
      return adminFetch<Counterparty>(
        `/api/admin/finance/counterparties/${selectedCounterparty.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editForm.name.trim(),
            kind: editForm.kind.trim(),
            externalCode: editForm.externalCode.trim() || undefined,
            contactEmail: editForm.contactEmail.trim() || undefined,
            contactPhone: editForm.contactPhone.trim() || undefined,
            isActive: editForm.isActive,
          }),
        },
      );
    },
    onSuccess: () => {
      invalidate(COUNTERPARTIES_QUERY_KEY);
      setEditOpen(false);
      setSelectedCounterparty(null);
      toast({
        title: "Counterparty updated",
        description: "Counterparty details were saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update counterparty",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      if (!canManageCounterparties) {
        throw new Error("finance.counterparties permission is required.");
      }
      return adminFetch<CounterpartyDeleteResult>(
        `/api/admin/finance/counterparties/${input.id}`,
        {
          method: "DELETE",
        },
      );
    },
    onSuccess: (result, input) => {
      invalidate(COUNTERPARTIES_QUERY_KEY);
      if (selectedCounterparty?.id === input.id) {
        setEditOpen(false);
        setSelectedCounterparty(null);
      }

      if (result.outcome === "deleted") {
        toast({
          title: "Counterparty deleted",
          description: `${input.name} was deleted because no payables reference it.`,
        });
        return;
      }

      if (result.outcome === "deactivated") {
        toast({
          title: "Counterparty deactivated",
          description: `${input.name} is used in payables, so it was deactivated instead of deleted.`,
        });
        return;
      }

      toast({
        title: "Counterparty already inactive",
        description: `${input.name} is already inactive and referenced by existing payables.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete counterparty",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (mode: "dry_run" | "apply") => {
      if (!canRunSyncPreview) {
        throw new Error(
          "Counterparty sync is not available for the current role.",
        );
      }
      if (mode === "apply" && !canRunSyncApply) {
        throw new Error(
          "finance.settings permission is required to apply sync.",
        );
      }
      const payload: Record<string, unknown> = {
        mode,
      };
      if (sourceFilter === "service_provider" || sourceFilter === "hotel") {
        payload.sourceType = sourceFilter;
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
      invalidate(COUNTERPARTIES_QUERY_KEY);
      invalidate(COUNTERPARTY_SYNC_HISTORY_QUERY_KEY);
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

  const rows = useMemo(
    () => counterpartiesQuery.data ?? [],
    [counterpartiesQuery.data],
  );
  const searchOptions = useMemo<ComboOption[]>(() => {
    const options = (counterpartySearchOptionsQuery.data ?? [])
      .map((row) => ({
        value: row.id,
        label: row.name,
        description: [
          row.kind,
          row.external_code,
          row.contact_email,
          row.contact_phone,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" • "),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      {
        value: SEARCH_ALL_VALUE,
        label: "All counterparties",
        description: "Clear search filter",
      },
      ...options,
    ];
  }, [counterpartySearchOptionsQuery.data]);
  const searchRows = counterpartySearchOptionsQuery.data ?? [];
  const createKindOptions = useMemo(
    () => buildKindOptions(createForm.kind),
    [createForm.kind],
  );
  const editKindOptions = useMemo(
    () => buildKindOptions(editForm.kind),
    [editForm.kind],
  );
  const summary = useMemo(() => {
    const active = rows.filter((row) => row.is_active).length;
    const linked = rows.filter(
      (row) =>
        row.source_type === "service_provider" || row.source_type === "hotel",
    ).length;
    const latestSyncedAt = rows
      .map((row) => row.last_synced_at)
      .filter((value): value is string => typeof value === "string")
      .sort((a, b) => b.localeCompare(a))[0];

    return {
      total: rows.length,
      active,
      linked,
      latestSyncedAt,
    };
  }, [rows]);

  const latestAuditRun = syncHistoryQuery.data?.[0] ?? null;
  const latestAuditCounters = useMemo(
    () => readAuditCounters(latestAuditRun?.payload),
    [latestAuditRun?.payload],
  );
  const latestVisibleCounters = lastSyncResult?.counters ?? latestAuditCounters;
  const handleSearchCounterpartyChange = (value: string) => {
    setSearchCounterpartyId(value);
    if (value === SEARCH_ALL_VALUE) {
      setSearch("");
      return;
    }

    const selected = searchRows.find((row) => row.id === value);
    if (!selected) {
      setSearch("");
      return;
    }

    const searchSeed =
      selected.name ||
      selected.external_code ||
      selected.contact_email ||
      selected.contact_phone ||
      "";
    setSearch(searchSeed);
  };

  if (!canViewCounterparties && !canRunSyncPreview) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Counterparty Registry
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage AP counterparties and run manual sync with providers/hotels.
          </p>
        </header>
        <Card className="border-border/80 bg-muted/20">
          <CardHeader>
            <CardTitle>Counterparty access is required</CardTitle>
            <CardDescription>
              This page is hidden for roles without counterparty or settings
              capability.
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
          Counterparty Registry
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage AP counterparties and run manual sync with providers/hotels.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Total counterparties</CardDescription>
            <CardTitle>{canViewCounterparties ? summary.total : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle>
              {canViewCounterparties ? summary.active : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Linked from source</CardDescription>
            <CardTitle>
              {canViewCounterparties ? summary.linked : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="border-b-0 bg-transparent pb-2">
            <CardDescription>Latest row sync</CardDescription>
            <CardTitle className="text-base">
              {formatDateTime(summary.latestSyncedAt)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual sync</CardTitle>
          <CardDescription>
            Preview or apply counterparty synchronization from service providers
            and hotels. Preview mode is dry-run only and does not save records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canRunSyncPreview ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => reconcileMutation.mutate("dry_run")}
                disabled={reconcileMutation.isPending}
              >
                {reconcileMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Preview sync
              </Button>
              {canRunSyncApply ? (
                <Button
                  onClick={() => reconcileMutation.mutate("apply")}
                  disabled={reconcileMutation.isPending}
                >
                  {reconcileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Run sync
                </Button>
              ) : (
                <p className="self-center text-xs text-muted-foreground">
                  Apply sync is available to settings-capable users only.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Counterparty sync is not available for the current role.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last sync run
              </p>
              <p className="text-sm font-medium">
                {latestAuditRun
                  ? formatDateTime(latestAuditRun.created_at)
                  : "-"}
              </p>
              {latestAuditRun ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {humanizeFinanceLabel(latestAuditRun.action)}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last action result
              </p>
              <p className="text-sm font-medium">
                {latestVisibleCounters
                  ? `Created ${latestVisibleCounters.created}, Updated ${latestVisibleCounters.updated}, Deactivated ${latestVisibleCounters.deactivated}`
                  : "-"}
              </p>
              {latestVisibleCounters ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Skipped: {latestVisibleCounters.skipped} • Errors:{" "}
                  {latestVisibleCounters.errors}
                </p>
              ) : null}
            </div>
          </div>

          {summary.total === 0 && canViewCounterparties ? (
            <p className="text-xs text-muted-foreground">
              No counterparties are stored yet. Click <strong>Run sync</strong>{" "}
              to apply changes, or add one manually from the button below.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Counterparties</CardTitle>
              <CardDescription>
                Search, review source linkage, and update active status.
              </CardDescription>
            </div>
            {canManageCounterparties ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add counterparty
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {canViewCounterparties ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <ComboBox
                    value={searchCounterpartyId}
                    options={searchOptions}
                    placeholder="Name, code, email, phone"
                    searchPlaceholder="Search counterparties..."
                    emptyLabel="No counterparties found."
                    disabled={counterpartySearchOptionsQuery.isLoading}
                    onChange={handleSearchCounterpartyChange}
                    contentClassName="w-[420px] p-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active status</Label>
                  <Select
                    value={activeFilter}
                    onValueChange={(value) =>
                      setActiveFilter(value as "all" | "true" | "false")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={sourceFilter}
                    onValueChange={(value) =>
                      setSourceFilter(
                        value as
                          | "all"
                          | "manual"
                          | "service_provider"
                          | "hotel",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="service_provider">
                        Service Provider
                      </SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {counterpartiesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading counterparties...
                </div>
              ) : null}

              {!counterpartiesQuery.isLoading && rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No counterparties found for the current filter.
                </p>
              ) : null}

              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {humanizeFinanceLabel(row.kind)} • Last synced{" "}
                        {formatDateTime(row.last_synced_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sourceBadgeVariant(row.source_type)}>
                        {humanizeFinanceLabel(row.source_type || "manual")}
                      </Badge>
                      <Badge variant={row.is_active ? "success" : "outline"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                    <p>Email: {row.contact_email || "-"}</p>
                    <p>Phone: {row.contact_phone || "-"}</p>
                    <p>Code: {row.external_code || "-"}</p>
                  </div>

                  {canManageCounterparties ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCounterparty(row);
                          setEditForm({
                            name: row.name || "",
                            kind: row.kind || "vendor",
                            externalCode: row.external_code || "",
                            contactEmail: row.contact_email || "",
                            contactPhone: row.contact_phone || "",
                            isActive: row.is_active,
                          });
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Delete ${row.name}? If this counterparty is used in payables, it will be deactivated instead.`,
                          );
                          if (!confirmed) {
                            return;
                          }
                          deleteMutation.mutate({
                            id: row.id,
                            name: row.name,
                          });
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables?.id === row.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Counterparty registry data is hidden for roles without payables or
              counterparty read access.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add counterparty</DialogTitle>
            <DialogDescription>
              Create a manual counterparty available for AP drafts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={createForm.kind}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    kind: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select counterparty type" />
                </SelectTrigger>
                <SelectContent>
                  {createKindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External code (optional)</Label>
              <Input
                value={createForm.externalCode}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    externalCode: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact email (optional)</Label>
              <Input
                type="email"
                value={createForm.contactEmail}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactEmail: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact phone (optional)</Label>
              <Input
                value={createForm.contactPhone}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactPhone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label>Active</Label>
              <Switch
                checked={createForm.isActive}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !canManageCounterparties}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit counterparty</DialogTitle>
            <DialogDescription>
              Update counterparty identity and active status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editForm.kind}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, kind: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select counterparty type" />
                </SelectTrigger>
                <SelectContent>
                  {editKindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External code (optional)</Label>
              <Input
                value={editForm.externalCode}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    externalCode: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact email (optional)</Label>
              <Input
                type="email"
                value={editForm.contactEmail}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    contactEmail: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact phone (optional)</Label>
              <Input
                value={editForm.contactPhone}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    contactPhone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label>Active</Label>
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !canManageCounterparties}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
