"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComboBox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";

type ProviderSummary = {
  id: string;
  name: string;
  facility_type?: string | null;
  city?: string | null;
  country_code?: string | null;
  is_partner?: boolean | null;
};

type PriceComponent = {
  code?: string;
  label: string;
  amountEgp: number;
  notes?: string;
};

type EditablePriceComponent = PriceComponent & {
  id: string;
};

type ProviderProcedurePricing = {
  id: string;
  name: string;
  treatmentId: string;
  treatmentName: string | null;
  treatmentCategory: string | null;
  treatmentSlug?: string | null;
  displayOrder: number;
  isPublic: boolean;
  priceList: {
    id: string;
    components: PriceComponent[];
    totalCostEgp: number;
    isActive: boolean;
  } | null;
};

type ProviderProcedurePricingResponse = {
  provider: {
    id: string;
    name: string;
    procedure_ids?: string[] | null;
  };
  procedures: ProviderProcedurePricing[];
};

const PRICING_PROVIDERS_QUERY_KEY = [
  "operations",
  "pricing",
  "providers",
] as const;
const getProviderPricingQueryKey = (providerId: string) =>
  ["operations", "pricing", "provider", providerId] as const;

const formatCurrency = (value: number, currency: "USD" | "EGP" = "EGP") => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const safeValue = (value: number | null | undefined) =>
  Number.isFinite(value ?? NaN) ? Number(value) : 0;

const UNCATEGORIZED_VALUE = "uncategorized";
const createComponentId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `component-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function OperationsPricingPage() {
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  const [providerId, setProviderId] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [selectedProcedureId, setSelectedProcedureId] = useState("");
  const [includeUnpriced, setIncludeUnpriced] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] =
    useState<ProviderProcedurePricing | null>(null);
  const [editingComponents, setEditingComponents] = useState<
    EditablePriceComponent[]
  >([]);
  const [editingActive, setEditingActive] = useState(true);

  const providersQuery = useQuery({
    queryKey: PRICING_PROVIDERS_QUERY_KEY,
    queryFn: () =>
      adminFetch<ProviderSummary[]>("/api/admin/operations/pricing/providers"),
    staleTime: 5 * 60 * 1000,
  });

  const providerPricingQuery = useQuery({
    queryKey: providerId
      ? getProviderPricingQueryKey(providerId)
      : ["operations", "pricing", "provider", "none"],
    queryFn: () =>
      adminFetch<ProviderProcedurePricingResponse>(
        `/api/admin/operations/pricing/providers/${providerId}/procedure-price-lists`,
      ),
    enabled: Boolean(providerId),
  });

  const procedures = useMemo(
    () => providerPricingQuery.data?.procedures ?? [],
    [providerPricingQuery.data?.procedures],
  );
  const providerOptions = useMemo(
    () =>
      (providersQuery.data ?? []).map((provider) => ({
        value: provider.id,
        label: provider.name,
        description: [provider.city, provider.country_code]
          .filter(Boolean)
          .join(", "),
      })),
    [providersQuery.data],
  );
  const visibleProcedures = useMemo(() => {
    if (includeUnpriced) {
      return procedures;
    }
    return procedures.filter((procedure) => procedure.priceList);
  }, [includeUnpriced, procedures]);
  const specialtyOptions = useMemo(() => {
    const map = new Map<string, string>();
    visibleProcedures.forEach((procedure) => {
      const rawCategory = procedure.treatmentCategory?.trim();
      const value = rawCategory ? rawCategory : UNCATEGORIZED_VALUE;
      const label = rawCategory ? rawCategory : "Uncategorized";
      map.set(value, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleProcedures]);
  const specialtyComboOptions = useMemo(
    () => [{ value: "__all__", label: "All specialties" }, ...specialtyOptions],
    [specialtyOptions],
  );
  const specialtyFilteredProcedures = useMemo(() => {
    if (!selectedSpecialty) {
      return visibleProcedures;
    }
    return visibleProcedures.filter((procedure) => {
      const rawCategory = procedure.treatmentCategory?.trim();
      const value = rawCategory ? rawCategory : UNCATEGORIZED_VALUE;
      return value === selectedSpecialty;
    });
  }, [selectedSpecialty, visibleProcedures]);
  const treatmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    specialtyFilteredProcedures.forEach((procedure) => {
      const label = procedure.treatmentName ?? "Unknown treatment";
      map.set(procedure.treatmentId, label);
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [specialtyFilteredProcedures]);
  const treatmentComboOptions = useMemo(
    () => [
      { value: "__all__", label: "All treatments" },
      ...treatmentOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [treatmentOptions],
  );
  const treatmentFilteredProcedures = useMemo(() => {
    if (!selectedTreatmentId) {
      return specialtyFilteredProcedures;
    }
    return specialtyFilteredProcedures.filter(
      (procedure) => procedure.treatmentId === selectedTreatmentId,
    );
  }, [selectedTreatmentId, specialtyFilteredProcedures]);
  const procedureOptions = useMemo(() => {
    return treatmentFilteredProcedures
      .map((procedure) => ({
        id: procedure.id,
        label: procedure.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [treatmentFilteredProcedures]);
  const procedureComboOptions = useMemo(
    () => [
      { value: "__all__", label: "All procedures" },
      ...procedureOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [procedureOptions],
  );
  const selectedProcedure = useMemo(
    () =>
      treatmentFilteredProcedures.find(
        (procedure) => procedure.id === selectedProcedureId,
      ) ?? null,
    [selectedProcedureId, treatmentFilteredProcedures],
  );
  const filteredProcedures = useMemo(() => {
    let filtered = visibleProcedures;
    if (selectedSpecialty) {
      filtered = filtered.filter((procedure) => {
        const rawCategory = procedure.treatmentCategory?.trim();
        const value = rawCategory ? rawCategory : UNCATEGORIZED_VALUE;
        return value === selectedSpecialty;
      });
    }
    if (selectedTreatmentId) {
      filtered = filtered.filter(
        (procedure) => procedure.treatmentId === selectedTreatmentId,
      );
    }
    if (selectedProcedureId) {
      filtered = filtered.filter(
        (procedure) => procedure.id === selectedProcedureId,
      );
    }
    const term = search.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((procedure) => {
        const haystack = [
          procedure.name,
          procedure.treatmentName ?? "",
          procedure.treatmentCategory ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
    }
    return [...filtered].sort((a, b) => {
      const byCategory = (a.treatmentCategory ?? "").localeCompare(
        b.treatmentCategory ?? "",
      );
      if (byCategory !== 0) return byCategory;
      const byTreatment = (a.treatmentName ?? "").localeCompare(
        b.treatmentName ?? "",
      );
      if (byTreatment !== 0) return byTreatment;
      return a.displayOrder - b.displayOrder;
    });
  }, [
    search,
    selectedProcedureId,
    selectedSpecialty,
    selectedTreatmentId,
    visibleProcedures,
  ]);

  useEffect(() => {
    if (
      selectedSpecialty &&
      !specialtyOptions.some((option) => option.value === selectedSpecialty)
    ) {
      setSelectedSpecialty("");
    }
  }, [selectedSpecialty, specialtyOptions]);

  useEffect(() => {
    if (
      selectedTreatmentId &&
      !treatmentOptions.some((option) => option.id === selectedTreatmentId)
    ) {
      setSelectedTreatmentId("");
    }
  }, [selectedTreatmentId, treatmentOptions]);

  useEffect(() => {
    if (
      selectedProcedureId &&
      !procedureOptions.some((option) => option.id === selectedProcedureId)
    ) {
      setSelectedProcedureId("");
    }
  }, [procedureOptions, selectedProcedureId]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProcedure(null);
    setEditingComponents([]);
    setEditingActive(true);
  };

  const openDialog = (procedure: ProviderProcedurePricing) => {
    setEditingProcedure(procedure);
    setEditingComponents(
      procedure.priceList?.components?.length
        ? procedure.priceList.components.map((component) => ({
            ...component,
            id: createComponentId(),
          }))
        : [{ id: createComponentId(), label: "", amountEgp: 0, notes: "" }],
    );
    setEditingActive(procedure.priceList?.isActive ?? true);
    setDialogOpen(true);
  };

  const updateEditingComponent = (
    index: number,
    patch: Partial<EditablePriceComponent>,
  ) => {
    setEditingComponents((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const removeEditingComponent = (index: number) => {
    setEditingComponents((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addEditingComponent = () => {
    setEditingComponents((prev) => [
      ...prev,
      { id: createComponentId(), label: "", amountEgp: 0, notes: "" },
    ]);
  };

  const upsertPriceListMutation = useMutation({
    mutationFn: async (payload: {
      providerId: string;
      procedureId: string;
      components: PriceComponent[];
      isActive: boolean;
    }) =>
      adminFetch(
        `/api/admin/operations/pricing/providers/${payload.providerId}/procedure-price-lists`,
        {
          method: "PUT",
          body: JSON.stringify({
            procedureId: payload.procedureId,
            components: payload.components,
            isActive: payload.isActive,
          }),
        },
      ),
    onSuccess: (_data, variables) => {
      invalidate(getProviderPricingQueryKey(variables.providerId));
      toast({
        title: "Price list saved",
        description: "Provider pricing has been updated.",
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Unable to save price list",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePriceListMutation = useMutation({
    mutationFn: async (payload: { priceListId: string; providerId: string }) =>
      adminFetch(
        `/api/admin/operations/pricing/procedure-price-lists/${payload.priceListId}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_data, variables) => {
      invalidate(getProviderPricingQueryKey(variables.providerId));
      toast({
        title: "Price list removed",
        description: "The provider price list was deleted.",
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Unable to delete price list",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const editingTotal = useMemo(
    () =>
      editingComponents.reduce(
        (sum, item) => sum + safeValue(item.amountEgp),
        0,
      ),
    [editingComponents],
  );

  const isSaving =
    upsertPriceListMutation.isPending || deletePriceListMutation.isPending;

  const handleSave = () => {
    if (!editingProcedure || !providerId) {
      return;
    }

    upsertPriceListMutation.mutate({
      providerId,
      procedureId: editingProcedure.id,
      components: editingComponents.map(
        ({ id: _id, ...component }) => component,
      ),
      isActive: editingActive,
    });
  };

  const handleDelete = () => {
    if (!editingProcedure?.priceList?.id || !providerId) {
      return;
    }
    if (!window.confirm("Delete this provider price list?")) {
      return;
    }
    deletePriceListMutation.mutate({
      priceListId: editingProcedure.priceList.id,
      providerId,
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Provider Price Lists
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Build and maintain multi-component pricing per provider and procedure.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Pricing management</CardTitle>
          <CardDescription>
            Filter by specialty and treatment to locate procedures quickly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Service provider</Label>
              <ComboBox
                value={providerId}
                options={providerOptions}
                placeholder={
                  providersQuery.isLoading
                    ? "Loading providers..."
                    : (providersQuery.data?.length ?? 0) === 0
                      ? "No providers available"
                      : "Select a provider"
                }
                searchPlaceholder="Search providers..."
                emptyLabel="No providers found."
                disabled={
                  providersQuery.isLoading ||
                  (providersQuery.data?.length ?? 0) === 0
                }
                onChange={(value) => {
                  setProviderId(value);
                  setSelectedSpecialty("");
                  setSelectedTreatmentId("");
                  setSelectedProcedureId("");
                  setSearch("");
                  closeDialog();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Search procedures</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by specialty, treatment, or procedure"
                disabled={!providerId}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Switch
                  checked={includeUnpriced}
                  onCheckedChange={setIncludeUnpriced}
                />
                <span className="text-sm text-muted-foreground">
                  Include unpriced
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Specialty</Label>
              <ComboBox
                value={selectedSpecialty || "__all__"}
                options={specialtyComboOptions}
                placeholder={
                  !providerId
                    ? "Select a provider first"
                    : specialtyOptions.length === 0
                      ? "No specialties available"
                      : "All specialties"
                }
                searchPlaceholder="Search specialties..."
                emptyLabel="No specialties found."
                disabled={!providerId || specialtyOptions.length === 0}
                onChange={(value) =>
                  setSelectedSpecialty(value === "__all__" ? "" : value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <ComboBox
                value={selectedTreatmentId || "__all__"}
                options={treatmentComboOptions}
                placeholder={
                  !providerId
                    ? "Select a provider first"
                    : treatmentOptions.length === 0
                      ? "No treatments available"
                      : "All treatments"
                }
                searchPlaceholder="Search treatments..."
                emptyLabel="No treatments found."
                disabled={!providerId || treatmentOptions.length === 0}
                onChange={(value) =>
                  setSelectedTreatmentId(value === "__all__" ? "" : value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Procedure</Label>
              <ComboBox
                value={selectedProcedureId || "__all__"}
                options={procedureComboOptions}
                placeholder={
                  !providerId
                    ? "Select a provider first"
                    : procedureOptions.length === 0
                      ? "No procedures available"
                      : "All procedures"
                }
                searchPlaceholder="Search procedures..."
                emptyLabel="No procedures found."
                disabled={!providerId || procedureOptions.length === 0}
                onChange={(value) =>
                  setSelectedProcedureId(value === "__all__" ? "" : value)
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => selectedProcedure && openDialog(selectedProcedure)}
              disabled={!selectedProcedure}
            >
              {selectedProcedure?.priceList
                ? "Edit selected"
                : "Add price list"}
            </Button>
            {selectedProcedure ? (
              <Badge
                variant={
                  selectedProcedure.priceList?.isActive
                    ? "secondary"
                    : "outline"
                }
              >
                {selectedProcedure.priceList
                  ? selectedProcedure.priceList.isActive
                    ? "Active price list"
                    : "Inactive price list"
                  : "Unpriced"}
              </Badge>
            ) : null}
          </div>

          {!providerId ? (
            <p className="text-sm text-muted-foreground">
              Choose a provider to manage its price lists.
            </p>
          ) : providerPricingQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading provider procedures...
            </div>
          ) : providerPricingQuery.isError ? (
            <p className="text-sm text-destructive">
              Unable to load provider procedures.
            </p>
          ) : filteredProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No procedures match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead className="w-[160px]">Total (EGP)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures.map((procedure) => {
                  const total = procedure.priceList
                    ? typeof procedure.priceList.totalCostEgp === "number"
                      ? procedure.priceList.totalCostEgp
                      : procedure.priceList.components.reduce(
                          (sum, item) => sum + safeValue(item.amountEgp),
                          0,
                        )
                    : 0;
                  const isActive = procedure.priceList?.isActive ?? false;
                  const specialtyLabel =
                    procedure.treatmentCategory?.trim() || "Uncategorized";

                  return (
                    <TableRow key={procedure.id}>
                      <TableCell>{specialtyLabel}</TableCell>
                      <TableCell>
                        {procedure.treatmentName ?? "Unknown treatment"}
                      </TableCell>
                      <TableCell>{procedure.name}</TableCell>
                      <TableCell>
                        {procedure.priceList ? (
                          formatCurrency(total, "EGP")
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {procedure.priceList ? (
                          <Badge variant={isActive ? "secondary" : "outline"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not set</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(procedure)}
                        >
                          {procedure.priceList ? "Edit" : "Add"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider price list</DialogTitle>
            <DialogDescription>
              Maintain the cost breakdown for this provider&apos;s procedure.
            </DialogDescription>
          </DialogHeader>

          {editingProcedure ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {editingProcedure.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editingProcedure.treatmentName ?? "Unknown treatment"}
                </p>
              </div>

              <div className="space-y-3">
                {editingComponents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No components yet. Add the first component below.
                  </p>
                ) : (
                  editingComponents.map((component, index) => (
                    <div
                      key={component.id}
                      className="grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto]"
                    >
                      <Input
                        placeholder="Component label"
                        value={component.label}
                        onChange={(event) =>
                          updateEditingComponent(index, {
                            label: event.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={
                          Number.isFinite(component.amountEgp)
                            ? component.amountEgp
                            : ""
                        }
                        onChange={(event) =>
                          updateEditingComponent(index, {
                            amountEgp:
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value),
                          })
                        }
                      />
                      <Input
                        placeholder="Notes (optional)"
                        value={component.notes ?? ""}
                        onChange={(event) =>
                          updateEditingComponent(index, {
                            notes: event.target.value,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeEditingComponent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditingComponent}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add component
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingActive}
                    onCheckedChange={setEditingActive}
                  />
                  <Label>Active</Label>
                </div>
                <div className="text-sm font-semibold">
                  Total: {formatCurrency(editingTotal, "EGP")}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a procedure to edit its price list.
            </p>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {editingProcedure?.priceList?.id ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !editingProcedure}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save price list
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
