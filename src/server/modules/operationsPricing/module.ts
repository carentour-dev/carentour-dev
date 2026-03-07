import { z } from "zod";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database, Json } from "@/integrations/supabase/types";

type ProviderRow = Database["public"]["Tables"]["service_providers"]["Row"];
type ProcedureRow = Database["public"]["Tables"]["treatment_procedures"]["Row"];
type PriceListRow =
  Database["public"]["Tables"]["service_provider_procedure_price_lists"]["Row"];

type PriceComponent = {
  code?: string;
  label: string;
  amountEgp: number;
  notes?: string;
};

type PricingImportScope = "operations" | "finance";

type PricingImportActor = {
  scope: PricingImportScope;
  permissions?: string[] | null;
  userId?: string | null;
  profileId?: string | null;
};

type ImportGroupDraft = {
  key: string;
  rowNumbers: number[];
  procedureId: string | null;
  procedureName: string | null;
  treatmentId: string | null;
  treatmentName: string | null;
  specialty: string | null;
  isActive?: boolean;
  components: PriceComponent[];
};

type ImportPayloadGroup = {
  key: string;
  rowNumbers: number[];
  procedureId: string | null;
  procedureName: string | null;
  treatmentId: string | null;
  treatmentName: string | null;
  specialty: string | null;
  isActive: boolean;
  components: PriceComponent[];
  resolvedTreatmentId: string | null;
  resolvedProcedureId: string | null;
  willCreateTreatment: boolean;
  willCreateProcedure: boolean;
};

type ImportRowResult = {
  key: string;
  rowNumbers: number[];
  status: "ready" | "blocked" | "applied";
  reason: string | null;
  procedureId: string | null;
  procedureName: string | null;
  treatmentId: string | null;
  treatmentName: string | null;
  specialty: string | null;
  willCreateTreatment: boolean;
  willCreateProcedure: boolean;
  componentCount: number;
  totalCostEgp: number;
};

type ImportSummary = {
  totalRows: number;
  readyRows: number;
  blockedRows: number;
  skippedRows: number;
  readyGroups: number;
  blockedGroups: number;
  createMissing: boolean;
};

type ImportApplyResult = {
  summary: {
    appliedGroups: number;
    createdTreatments: number;
    createdProcedures: number;
    upsertedPriceLists: number;
  };
  rowResults: Array<{
    rowNumbers: number[];
    treatmentId: string;
    procedureId: string;
    procedureName: string;
    componentCount: number;
    totalCostEgp: number;
  }>;
};

type ImportResponse = {
  runId: string;
  summary: ImportSummary;
  rowResults: ImportRowResult[];
  blockingErrors: string[];
  warnings: string[];
  canApply: boolean;
  applyResult?: ImportApplyResult;
};

type ImportApplyRpcResponse = ImportApplyResult | { error: string };

const providerIdSchema = z.string().uuid();

const componentSchema = z.object({
  code: z.string().optional(),
  label: z.string().min(1, "Component label is required"),
  amountEgp: z.coerce.number().min(0, "Component amount must be 0 or greater"),
  notes: z.string().optional(),
});

const upsertSchema = z.object({
  procedureId: z.string().uuid(),
  components: z.array(componentSchema).default([]),
  isActive: z.boolean().optional(),
});

const previewImportSchema = z.object({
  mode: z.literal("dry_run").optional(),
  rows: z.array(z.array(z.string())).min(2),
  runId: z.string().uuid().optional(),
  options: z
    .object({
      createMissing: z.boolean().optional(),
    })
    .optional(),
});

const applyImportSchema = z.object({
  mode: z.literal("apply").optional(),
  runId: z.string().uuid(),
  rows: z.array(z.array(z.string())).optional(),
  options: z
    .object({
      createMissing: z.boolean().optional(),
    })
    .optional(),
});

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const sanitizeComponents = (
  components: z.infer<typeof componentSchema>[],
): PriceComponent[] => {
  return components
    .map((component) => {
      const label = component.label.trim();
      const amountEgp = Math.max(0, toNumber(component.amountEgp));
      const code = isNonEmptyString(component.code)
        ? component.code.trim()
        : undefined;
      const notes = isNonEmptyString(component.notes)
        ? component.notes.trim()
        : undefined;

      return {
        label,
        amountEgp,
        ...(code ? { code } : {}),
        ...(notes ? { notes } : {}),
      };
    })
    .filter((component) => component.label.length > 0);
};

const normalizeComponentsFromJson = (value: Json | null): PriceComponent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const label = isNonEmptyString(record.label) ? record.label.trim() : "";
      const amount = record.amountEgp ?? record.amount_egp;
      const amountEgp = Math.max(0, toNumber(amount));
      const code = isNonEmptyString(record.code)
        ? record.code.trim()
        : undefined;
      const notes = isNonEmptyString(record.notes)
        ? record.notes.trim()
        : undefined;

      if (!label) {
        return null;
      }

      return {
        label,
        amountEgp,
        ...(code ? { code } : {}),
        ...(notes ? { notes } : {}),
      };
    })
    .filter((entry): entry is PriceComponent => Boolean(entry));
};

const computeTotal = (components: PriceComponent[]) =>
  components.reduce((sum, item) => sum + toNumber(item.amountEgp), 0);

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "_");

const normalizeText = (value: string | null | undefined) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const parseBoolean = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return undefined;
};

const hasPermission = (
  permissions: string[] | null | undefined,
  permission: string,
) => Boolean(permissions?.includes(permission));

const ensureCreateMissingPermission = (
  createMissing: boolean,
  actor?: PricingImportActor | null,
) => {
  if (!createMissing) return;

  const permissions = actor?.permissions ?? [];
  const hasAdmin = hasPermission(permissions, "admin.access");

  if (actor?.scope === "operations") {
    if (!hasAdmin) {
      throw new ApiError(
        403,
        "admin.access permission is required to create missing records",
      );
    }
    return;
  }

  if (actor?.scope === "finance") {
    if (!hasPermission(permissions, "finance.settings")) {
      throw new ApiError(
        403,
        "finance.settings permission is required to create missing records",
      );
    }
    return;
  }

  throw new ApiError(
    403,
    "Missing permissions to create treatments or procedures from import",
  );
};

const parseUuidOrNull = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const result = z.string().uuid().safeParse(trimmed);
  return result.success ? result.data : null;
};

const toImportGroupKey = (input: {
  procedureId: string | null;
  procedureName: string | null;
  treatmentId: string | null;
  treatmentName: string | null;
  specialty: string | null;
}) => {
  if (input.procedureId) {
    return `procedure:${input.procedureId}`;
  }

  return [
    "name",
    normalizeText(input.procedureName),
    "treatment",
    input.treatmentId ?? normalizeText(input.treatmentName),
    "specialty",
    normalizeText(input.specialty),
  ].join(":");
};

const normalizeRowNumbers = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
};

const normalizeImportRowResult = (
  value: Record<string, unknown>,
): ImportRowResult => {
  const status =
    value.status === "blocked" || value.status === "applied"
      ? value.status
      : "ready";

  return {
    key: typeof value.key === "string" ? value.key : "",
    rowNumbers: normalizeRowNumbers(value.row_numbers ?? value.rowNumbers),
    status,
    reason: isNonEmptyString(value.reason) ? value.reason.trim() : null,
    procedureId:
      typeof value.procedure_id === "string"
        ? value.procedure_id
        : typeof value.procedureId === "string"
          ? value.procedureId
          : null,
    procedureName:
      typeof value.procedure_name === "string"
        ? value.procedure_name
        : typeof value.procedureName === "string"
          ? value.procedureName
          : null,
    treatmentId:
      typeof value.treatment_id === "string"
        ? value.treatment_id
        : typeof value.treatmentId === "string"
          ? value.treatmentId
          : null,
    treatmentName:
      typeof value.treatment_name === "string"
        ? value.treatment_name
        : typeof value.treatmentName === "string"
          ? value.treatmentName
          : null,
    specialty: typeof value.specialty === "string" ? value.specialty : null,
    willCreateTreatment: Boolean(
      value.will_create_treatment ?? value.willCreateTreatment,
    ),
    willCreateProcedure: Boolean(
      value.will_create_procedure ?? value.willCreateProcedure,
    ),
    componentCount: Math.max(
      0,
      Number(value.component_count ?? value.componentCount ?? 0),
    ),
    totalCostEgp: Math.max(
      0,
      toNumber(value.total_cost_egp ?? value.totalCostEgp ?? 0),
    ),
  };
};

const sortImportRowResults = (items: ImportRowResult[]) =>
  [...items].sort((a, b) => {
    const rowA = a.rowNumbers[0] ?? Number.MAX_SAFE_INTEGER;
    const rowB = b.rowNumbers[0] ?? Number.MAX_SAFE_INTEGER;
    return rowA - rowB;
  });

const buildBlockingErrors = (items: ImportRowResult[], base: string[] = []) => {
  const itemErrors = items
    .filter((item) => item.status === "blocked" && item.reason)
    .map(
      (item) =>
        `Rows ${item.rowNumbers.join(", ")}: ${item.reason ?? "Blocked"}`,
    );

  return [...base, ...itemErrors];
};

const readRunRowResults = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  runId: string,
): Promise<ImportRowResult[]> => {
  const { data, error } = await (supabase as any)
    .from("operations_pricing_import_items")
    .select(
      "item_key, row_numbers, status, reason, procedure_id, procedure_name, treatment_id, treatment_name, specialty, will_create_treatment, will_create_procedure, component_count, total_cost_egp",
    )
    .eq("run_id", runId);

  if (error) {
    throw new ApiError(
      500,
      "Failed to load pricing import run rows",
      error.message,
    );
  }

  return sortImportRowResults(
    (data ?? []).map((entry: Record<string, unknown>) =>
      normalizeImportRowResult({
        ...entry,
        key: entry.item_key,
      }),
    ),
  );
};

export const operationsPricingController = {
  async listProviders({ partnerOnly = false } = {}) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("service_providers")
      .select("id, name, facility_type, city, country_code, is_partner")
      .order("name", { ascending: true });

    if (partnerOnly) {
      query = query.or("is_partner.is.null,is_partner.eq.true");
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(
        500,
        "Failed to load service providers",
        error.message,
      );
    }

    return data ?? [];
  },

  async listProviderProcedurePricing(providerId: unknown) {
    const parsedProviderId = providerIdSchema.parse(providerId);
    const supabase = getSupabaseAdmin();

    const { data: provider, error: providerError } = await supabase
      .from("service_providers")
      .select("id, name, procedure_ids")
      .eq("id", parsedProviderId)
      .maybeSingle();

    if (providerError) {
      throw new ApiError(
        500,
        "Failed to load service provider",
        providerError.message,
      );
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }

    const offeredProcedureIds = Array.isArray(provider.procedure_ids)
      ? provider.procedure_ids.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [];
    const orFilters = [`created_by_provider_id.eq.${parsedProviderId}`];
    if (offeredProcedureIds.length > 0) {
      orFilters.push(`id.in.(${offeredProcedureIds.join(",")})`);
    }

    const { data: procedures, error: proceduresError } = await supabase
      .from("treatment_procedures")
      .select(
        "id, name, treatment_id, display_order, is_public, created_by_provider_id, treatments(name, category, slug)",
      )
      .or(orFilters.join(","));

    if (proceduresError) {
      throw new ApiError(
        500,
        "Failed to load procedures",
        proceduresError.message,
      );
    }

    const procedureIdsForPricing = (procedures ?? []).map(
      (procedure) => procedure.id,
    );
    const providerOwnedProcedureIds = (procedures ?? [])
      .filter(
        (procedure) => procedure.created_by_provider_id === parsedProviderId,
      )
      .map((procedure) => procedure.id);
    const currentProcedureIds = new Set(offeredProcedureIds);
    const missingOwnedProcedures = providerOwnedProcedureIds.filter(
      (id) => !currentProcedureIds.has(id),
    );

    if (missingOwnedProcedures.length > 0) {
      const nextProcedureIds = [
        ...currentProcedureIds,
        ...missingOwnedProcedures,
      ];
      const { error: updateError } = await supabase
        .from("service_providers")
        .update({ procedure_ids: nextProcedureIds })
        .eq("id", parsedProviderId);

      if (updateError) {
        console.error(
          "Failed to sync provider-owned procedures to procedure_ids",
          updateError,
        );
      }
    }

    if (procedureIdsForPricing.length === 0) {
      return { provider, procedures: [] };
    }

    const { data: priceLists, error: priceListError } = await supabase
      .from("service_provider_procedure_price_lists")
      .select("*")
      .eq("service_provider_id", parsedProviderId)
      .in("procedure_id", procedureIdsForPricing);

    if (priceListError) {
      throw new ApiError(
        500,
        "Failed to load procedure price lists",
        priceListError.message,
      );
    }

    const priceListMap = new Map<string, PriceListRow>();
    for (const priceList of priceLists ?? []) {
      priceListMap.set(priceList.procedure_id, priceList);
    }

    const normalizedProcedures = (procedures ?? []).map((procedure) => {
      const treatmentMeta = (
        procedure as ProcedureRow & {
          treatments?: { name?: string; category?: string; slug?: string };
        }
      ).treatments;
      const treatmentName = treatmentMeta?.name ?? null;
      const treatmentCategory = treatmentMeta?.category ?? null;
      const treatmentSlug = treatmentMeta?.slug ?? null;
      const priceList = priceListMap.get(procedure.id);
      const components = priceList
        ? normalizeComponentsFromJson(priceList.components as Json)
        : [];
      const totalCostEgp =
        typeof priceList?.total_cost_egp === "number"
          ? priceList.total_cost_egp
          : computeTotal(components);

      return {
        id: procedure.id,
        name: procedure.name,
        treatmentId: procedure.treatment_id,
        treatmentName,
        treatmentCategory,
        treatmentSlug,
        displayOrder:
          typeof procedure.display_order === "number"
            ? procedure.display_order
            : 0,
        isPublic: procedure.is_public !== false,
        priceList: priceList
          ? {
              id: priceList.id,
              components,
              totalCostEgp,
              isActive: priceList.is_active,
            }
          : null,
      };
    });

    normalizedProcedures.sort((a, b) => {
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

    return { provider, procedures: normalizedProcedures };
  },

  async upsertPriceList(providerId: unknown, payload: unknown) {
    const parsedProviderId = providerIdSchema.parse(providerId);
    const parsed = upsertSchema.parse(payload);
    const components = sanitizeComponents(parsed.components ?? []);
    const totalCostEgp = computeTotal(components);

    const supabase = getSupabaseAdmin();

    const { data: provider, error: providerError } = await supabase
      .from("service_providers")
      .select("id, procedure_ids")
      .eq("id", parsedProviderId)
      .maybeSingle();

    if (providerError) {
      throw new ApiError(
        500,
        "Failed to load service provider",
        providerError.message,
      );
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }

    const upsertPayload: Database["public"]["Tables"]["service_provider_procedure_price_lists"]["Insert"] =
      {
        service_provider_id: parsedProviderId,
        procedure_id: parsed.procedureId,
        components: components as Json,
        total_cost_egp: totalCostEgp,
        is_active: parsed.isActive ?? true,
      };

    const { data: priceList, error } = await supabase
      .from("service_provider_procedure_price_lists")
      .upsert(upsertPayload, { onConflict: "service_provider_id,procedure_id" })
      .select("*")
      .single();

    if (error || !priceList) {
      throw new ApiError(
        500,
        "Failed to save provider price list",
        error?.message,
      );
    }

    const existingIds = Array.isArray(provider.procedure_ids)
      ? provider.procedure_ids.filter((id): id is string => Boolean(id))
      : [];

    if (!existingIds.includes(parsed.procedureId)) {
      const { error: updateError } = await supabase
        .from("service_providers")
        .update({ procedure_ids: [...existingIds, parsed.procedureId] })
        .eq("id", parsedProviderId);

      if (updateError) {
        throw new ApiError(
          500,
          "Failed to link procedure to provider",
          updateError.message,
        );
      }
    }

    return {
      id: priceList.id,
      procedureId: priceList.procedure_id,
      serviceProviderId: priceList.service_provider_id,
      components,
      totalCostEgp,
      isActive: priceList.is_active,
    };
  },

  async previewPriceListImport(
    providerId: unknown,
    payload: unknown,
    actor?: PricingImportActor | null,
  ): Promise<ImportResponse> {
    const parsedProviderId = providerIdSchema.parse(providerId);
    const parsed = previewImportSchema.parse(payload);
    const createMissing = parsed.options?.createMissing ?? false;
    ensureCreateMissingPermission(createMissing, actor);

    const supabase = getSupabaseAdmin();

    const { data: provider, error: providerError } = await supabase
      .from("service_providers")
      .select("id")
      .eq("id", parsedProviderId)
      .maybeSingle();

    if (providerError) {
      throw new ApiError(
        500,
        "Failed to load service provider",
        providerError.message,
      );
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }

    const { error: deleteTransientRunsError } = await (supabase as any)
      .from("operations_pricing_import_runs")
      .delete()
      .eq("provider_id", parsedProviderId)
      .in("status", ["preview", "failed"]);

    if (deleteTransientRunsError) {
      throw new ApiError(
        500,
        "Failed to clean previous non-applied pricing import runs",
        deleteTransientRunsError.message,
      );
    }

    const headers = parsed.rows[0]!.map((header) => normalizeHeader(header));
    const getIndex = (key: string) => headers.indexOf(key);
    const index = {
      providerId: getIndex("provider_id"),
      procedureId: getIndex("procedure_id"),
      procedureName: getIndex("procedure_name"),
      treatmentId: getIndex("treatment_id"),
      treatmentName: getIndex("treatment_name"),
      specialty: getIndex("specialty"),
      label: getIndex("component_label"),
      amount: getIndex("component_amount_egp"),
      notes: getIndex("component_notes"),
      code: getIndex("component_code"),
      isActive: getIndex("is_active"),
    };

    if (index.label < 0 || index.amount < 0) {
      throw new ApiError(
        400,
        "Headers must include component_label and component_amount_egp",
      );
    }

    if (index.procedureId < 0 && index.procedureName < 0) {
      throw new ApiError(
        400,
        "Headers must include procedure_id or procedure_name",
      );
    }

    const earlyBlockedResults: ImportRowResult[] = [];
    const warnings: string[] = [];
    const draftGroups = new Map<string, ImportGroupDraft>();
    let totalRows = 0;
    let earlyBlockedRows = 0;
    let skippedRows = 0;

    const addEarlyBlockedResult = (rowNumber: number, reason: string) => {
      earlyBlockedRows += 1;
      earlyBlockedResults.push({
        key: `row:${rowNumber}`,
        rowNumbers: [rowNumber],
        status: "blocked",
        reason,
        procedureId: null,
        procedureName: null,
        treatmentId: null,
        treatmentName: null,
        specialty: null,
        willCreateTreatment: false,
        willCreateProcedure: false,
        componentCount: 0,
        totalCostEgp: 0,
      });
    };

    parsed.rows.slice(1).forEach((rowValues, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const hasAnyValue = rowValues.some((cell) => cell.trim().length > 0);
      if (!hasAnyValue) {
        return;
      }

      totalRows += 1;

      const rowProviderId =
        index.providerId >= 0
          ? (rowValues[index.providerId]?.trim() ?? "")
          : "";
      if (rowProviderId && rowProviderId !== parsedProviderId) {
        skippedRows += 1;
        warnings.push(
          `Row ${rowNumber}: skipped because provider_id does not match selected provider.`,
        );
        return;
      }

      const label = rowValues[index.label]?.trim() ?? "";
      if (!label) {
        skippedRows += 1;
        warnings.push(
          `Row ${rowNumber}: skipped because component_label is empty.`,
        );
        return;
      }

      const amountRaw = rowValues[index.amount]?.trim() ?? "";
      const amountParsed = Number(amountRaw);
      if (!Number.isFinite(amountParsed)) {
        addEarlyBlockedResult(
          rowNumber,
          "component_amount_egp must be a numeric value.",
        );
        return;
      }

      if (amountParsed < 0) {
        addEarlyBlockedResult(
          rowNumber,
          "component_amount_egp must be 0 or greater.",
        );
        return;
      }

      const procedureIdValue =
        index.procedureId >= 0
          ? (rowValues[index.procedureId]?.trim() ?? "")
          : "";
      const procedureId = parseUuidOrNull(procedureIdValue);
      if (procedureIdValue && !procedureId) {
        addEarlyBlockedResult(rowNumber, "procedure_id must be a valid UUID.");
        return;
      }

      const treatmentIdValue =
        index.treatmentId >= 0
          ? (rowValues[index.treatmentId]?.trim() ?? "")
          : "";
      const treatmentId = parseUuidOrNull(treatmentIdValue);
      if (treatmentIdValue && !treatmentId) {
        addEarlyBlockedResult(rowNumber, "treatment_id must be a valid UUID.");
        return;
      }

      const procedureName =
        index.procedureName >= 0
          ? (rowValues[index.procedureName]?.trim() ?? "")
          : "";
      const treatmentName =
        index.treatmentName >= 0
          ? (rowValues[index.treatmentName]?.trim() ?? "")
          : "";
      const specialty =
        index.specialty >= 0 ? (rowValues[index.specialty]?.trim() ?? "") : "";

      if (!procedureId && !procedureName) {
        addEarlyBlockedResult(
          rowNumber,
          "procedure_name is required when procedure_id is missing.",
        );
        return;
      }

      if (!procedureId && !treatmentId && !treatmentName) {
        addEarlyBlockedResult(
          rowNumber,
          "treatment_name or treatment_id is required when procedure_id is missing.",
        );
        return;
      }

      const isActiveRaw =
        index.isActive >= 0 ? (rowValues[index.isActive]?.trim() ?? "") : "";
      const parsedIsActive = parseBoolean(isActiveRaw);
      if (isActiveRaw && parsedIsActive === undefined) {
        addEarlyBlockedResult(
          rowNumber,
          "is_active must be true/false, yes/no, or 1/0.",
        );
        return;
      }

      const key = toImportGroupKey({
        procedureId,
        procedureName: procedureName || null,
        treatmentId,
        treatmentName: treatmentName || null,
        specialty: specialty || null,
      });

      const existing = draftGroups.get(key);
      if (existing) {
        if (
          parsedIsActive !== undefined &&
          existing.isActive !== undefined &&
          existing.isActive !== parsedIsActive
        ) {
          addEarlyBlockedResult(
            rowNumber,
            "is_active conflicts with another row for the same procedure.",
          );
          return;
        }

        if (parsedIsActive !== undefined) {
          existing.isActive = parsedIsActive;
        }

        existing.rowNumbers.push(rowNumber);
        existing.components.push({
          label,
          amountEgp: Math.max(0, amountParsed),
          ...(index.notes >= 0 && rowValues[index.notes]?.trim()
            ? { notes: rowValues[index.notes]!.trim() }
            : {}),
          ...(index.code >= 0 && rowValues[index.code]?.trim()
            ? { code: rowValues[index.code]!.trim() }
            : {}),
        });
        return;
      }

      draftGroups.set(key, {
        key,
        rowNumbers: [rowNumber],
        procedureId,
        procedureName: procedureName || null,
        treatmentId,
        treatmentName: treatmentName || null,
        specialty: specialty || null,
        isActive: parsedIsActive,
        components: [
          {
            label,
            amountEgp: Math.max(0, amountParsed),
            ...(index.notes >= 0 && rowValues[index.notes]?.trim()
              ? { notes: rowValues[index.notes]!.trim() }
              : {}),
            ...(index.code >= 0 && rowValues[index.code]?.trim()
              ? { code: rowValues[index.code]!.trim() }
              : {}),
          },
        ],
      });
    });

    if (draftGroups.size === 0) {
      const firstBlockingRowReasons = earlyBlockedResults
        .filter((item) => item.reason)
        .slice(0, 3)
        .map(
          (item) =>
            `Row ${item.rowNumbers.join(", ")}: ${item.reason ?? "Blocked"}`,
        );
      const firstWarningReasons = warnings.slice(0, 3);
      const errorDetails =
        firstBlockingRowReasons.length > 0
          ? firstBlockingRowReasons.join(" | ")
          : firstWarningReasons.length > 0
            ? firstWarningReasons.join(" | ")
            : null;
      throw new ApiError(
        400,
        "No valid price list rows were found.",
        errorDetails,
      );
    }

    const { data: treatments, error: treatmentsError } = await supabase
      .from("treatments")
      .select("id, name, category");

    if (treatmentsError) {
      throw new ApiError(
        500,
        "Failed to load treatments",
        treatmentsError.message,
      );
    }

    const { data: procedures, error: proceduresError } = await supabase
      .from("treatment_procedures")
      .select("id, name, treatment_id, created_by_provider_id");

    if (proceduresError) {
      throw new ApiError(
        500,
        "Failed to load procedures",
        proceduresError.message,
      );
    }

    const treatmentById = new Map<
      string,
      { id: string; name: string; category: string | null }
    >();
    const treatmentsByKey = new Map<string, string[]>();

    (treatments ?? []).forEach((treatment) => {
      treatmentById.set(treatment.id, {
        id: treatment.id,
        name: treatment.name,
        category: treatment.category ?? null,
      });
      const key = [
        normalizeText(treatment.name),
        normalizeText(treatment.category),
      ].join("|");
      const existing = treatmentsByKey.get(key) ?? [];
      existing.push(treatment.id);
      treatmentsByKey.set(key, existing);
    });

    const procedureById = new Map<
      string,
      {
        id: string;
        name: string;
        treatmentId: string;
        createdByProviderId: string | null;
      }
    >();
    const proceduresByTreatmentAndName = new Map<
      string,
      Array<{
        id: string;
        name: string;
        treatmentId: string;
        createdByProviderId: string | null;
      }>
    >();

    (procedures ?? []).forEach((procedure) => {
      const normalized = {
        id: procedure.id,
        name: procedure.name,
        treatmentId: procedure.treatment_id,
        createdByProviderId: procedure.created_by_provider_id ?? null,
      };
      procedureById.set(procedure.id, normalized);
      const key = `${procedure.treatment_id}|${normalizeText(procedure.name)}`;
      const existing = proceduresByTreatmentAndName.get(key) ?? [];
      existing.push(normalized);
      proceduresByTreatmentAndName.set(key, existing);
    });

    const items: ImportRowResult[] = [];
    const readyGroups: ImportPayloadGroup[] = [];
    let readyRows = 0;
    let blockedGroups = 0;
    let blockedRowsFromGroups = 0;

    for (const group of draftGroups.values()) {
      let resolvedTreatmentId: string | null = null;
      let resolvedProcedureId: string | null = null;
      let willCreateTreatment = false;
      let willCreateProcedure = false;
      let reason: string | null = null;

      if (group.procedureId) {
        const matchedProcedure = procedureById.get(group.procedureId);
        if (!matchedProcedure) {
          reason = "procedure_id does not exist.";
        } else {
          resolvedProcedureId = matchedProcedure.id;
          resolvedTreatmentId = matchedProcedure.treatmentId;

          if (
            group.procedureName &&
            normalizeText(group.procedureName) !==
              normalizeText(matchedProcedure.name)
          ) {
            reason = "procedure_name does not match the provided procedure_id.";
          }

          if (
            group.treatmentId &&
            group.treatmentId !== matchedProcedure.treatmentId
          ) {
            reason =
              "treatment_id does not match the treatment linked to procedure_id.";
          }

          const matchedTreatment = treatmentById.get(
            matchedProcedure.treatmentId,
          );
          if (
            !reason &&
            group.treatmentName &&
            normalizeText(group.treatmentName) !==
              normalizeText(matchedTreatment?.name)
          ) {
            reason =
              "treatment_name does not match the treatment linked to procedure_id.";
          }

          if (
            !reason &&
            group.specialty &&
            normalizeText(group.specialty) !==
              normalizeText(matchedTreatment?.category)
          ) {
            reason =
              "specialty does not match the treatment linked to procedure_id.";
          }
        }
      } else {
        if (group.treatmentId) {
          if (!treatmentById.has(group.treatmentId)) {
            reason = "treatment_id does not exist.";
          } else {
            resolvedTreatmentId = group.treatmentId;
          }
        } else if (group.treatmentName) {
          const treatmentKey = [
            normalizeText(group.treatmentName),
            normalizeText(group.specialty),
          ].join("|");
          const matches = treatmentsByKey.get(treatmentKey) ?? [];
          if (matches.length === 1) {
            resolvedTreatmentId = matches[0]!;
          } else if (matches.length > 1) {
            reason =
              "treatment_name and specialty match multiple treatments; use treatment_id.";
          }
        }

        if (!resolvedTreatmentId && !reason) {
          if (createMissing) {
            willCreateTreatment = true;
          } else {
            reason =
              "Treatment was not found; enable create missing or provide treatment_id.";
          }
        }

        if (!reason) {
          if (resolvedTreatmentId) {
            const procedureKey = `${resolvedTreatmentId}|${normalizeText(group.procedureName)}`;
            const matches =
              proceduresByTreatmentAndName.get(procedureKey) ?? [];
            const providerOwnedMatches = matches.filter(
              (entry) => entry.createdByProviderId === parsedProviderId,
            );

            if (providerOwnedMatches.length === 1) {
              resolvedProcedureId = providerOwnedMatches[0]!.id;
            } else if (providerOwnedMatches.length > 1) {
              reason =
                "procedure_name matches multiple provider-owned procedures; use procedure_id.";
            } else if (matches.length === 1) {
              resolvedProcedureId = matches[0]!.id;
            } else if (matches.length > 1) {
              reason =
                "procedure_name matches multiple procedures; use procedure_id.";
            }
          }

          if (!resolvedProcedureId && !reason) {
            if (createMissing) {
              willCreateProcedure = true;
            } else {
              reason =
                "Procedure was not found; enable create missing or provide procedure_id.";
            }
          }
        }
      }

      const totalCostEgp = computeTotal(group.components);
      const item: ImportRowResult = {
        key: group.key,
        rowNumbers: [...group.rowNumbers],
        status: reason ? "blocked" : "ready",
        reason,
        procedureId: resolvedProcedureId ?? group.procedureId ?? null,
        procedureName: group.procedureName,
        treatmentId: resolvedTreatmentId ?? group.treatmentId ?? null,
        treatmentName: group.treatmentName,
        specialty: group.specialty,
        willCreateTreatment,
        willCreateProcedure,
        componentCount: group.components.length,
        totalCostEgp,
      };

      items.push(item);

      if (reason) {
        blockedGroups += 1;
        blockedRowsFromGroups += group.rowNumbers.length;
      } else {
        readyRows += group.rowNumbers.length;
        readyGroups.push({
          key: group.key,
          rowNumbers: [...group.rowNumbers],
          procedureId: group.procedureId,
          procedureName: group.procedureName,
          treatmentId: group.treatmentId,
          treatmentName: group.treatmentName,
          specialty: group.specialty,
          isActive: group.isActive ?? true,
          components: group.components,
          resolvedTreatmentId,
          resolvedProcedureId,
          willCreateTreatment,
          willCreateProcedure,
        });
      }
    }

    const summary = {
      totalRows,
      readyRows,
      blockedRows: earlyBlockedRows + blockedRowsFromGroups,
      skippedRows,
      readyGroups: readyGroups.length,
      blockedGroups,
      createMissing,
    };
    const canApply = summary.blockedRows === 0 && readyGroups.length > 0;
    const rowResults = sortImportRowResults([...earlyBlockedResults, ...items]);
    const blockingErrors = buildBlockingErrors(rowResults);

    const runPayload = {
      headers,
      groups: readyGroups,
      totalRows,
      skippedRows,
    };

    const readyGroupsByKey = new Map(
      readyGroups.map((group) => [group.key, group]),
    );

    const runItemsPayload = rowResults.map((item) => {
      const groupPayload =
        item.status === "ready" ? readyGroupsByKey.get(item.key) : null;

      return {
        item_key: item.key,
        row_numbers: item.rowNumbers,
        status: item.status,
        reason: item.reason,
        procedure_id: item.procedureId,
        procedure_name: item.procedureName,
        treatment_id: item.treatmentId,
        treatment_name: item.treatmentName,
        specialty: item.specialty,
        will_create_treatment: item.willCreateTreatment,
        will_create_procedure: item.willCreateProcedure,
        component_count: item.componentCount,
        total_cost_egp: item.totalCostEgp,
        payload: groupPayload ? (groupPayload as Json) : null,
      };
    });

    const previewEventPayload = {
      summary,
      canApply,
      blockingErrorsCount: blockingErrors.length,
      warningsCount: warnings.length,
    };

    const { data: runId, error: runError } = await (supabase as any).rpc(
      "create_operations_pricing_import_preview",
      {
        p_provider_id: parsedProviderId,
        p_create_missing: createMissing,
        p_can_apply: canApply,
        p_blocking_count: summary.blockedRows,
        p_preview_payload: runPayload as Json,
        p_summary: summary as Json,
        p_items: runItemsPayload as Json,
        p_created_by_user_id: actor?.userId ?? null,
        p_created_by_profile_id: actor?.profileId ?? null,
        p_event_payload: previewEventPayload as Json,
      },
    );

    if (runError || typeof runId !== "string" || runId.length === 0) {
      throw new ApiError(
        500,
        "Failed to create pricing import preview run",
        runError?.message,
      );
    }

    const previewResponse: ImportResponse = {
      runId,
      summary,
      rowResults,
      blockingErrors,
      warnings,
      canApply,
    };

    return previewResponse;
  },

  async applyPriceListImport(
    providerId: unknown,
    payload: unknown,
    actor?: PricingImportActor | null,
  ): Promise<ImportResponse> {
    const parsedProviderId = providerIdSchema.parse(providerId);
    const parsed = applyImportSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const { data: run, error: runError } = await (supabase as any)
      .from("operations_pricing_import_runs")
      .select(
        "id, provider_id, create_missing, blocking_count, can_apply, status, summary, result",
      )
      .eq("id", parsed.runId)
      .maybeSingle();

    if (runError) {
      throw new ApiError(
        500,
        "Failed to load pricing import run",
        runError.message,
      );
    }

    if (!run) {
      throw new ApiError(404, "Pricing import run not found");
    }

    if (run.provider_id !== parsedProviderId) {
      throw new ApiError(403, "Import run does not belong to this provider");
    }

    if (
      parsed.options?.createMissing !== undefined &&
      parsed.options.createMissing !== Boolean(run.create_missing)
    ) {
      throw new ApiError(
        400,
        "createMissing option does not match the preview run configuration",
      );
    }

    const runSummaryRecord =
      run.summary && typeof run.summary === "object"
        ? (run.summary as Record<string, unknown>)
        : {};
    const summary: ImportSummary = {
      totalRows: Math.max(0, Number(runSummaryRecord.totalRows ?? 0)),
      readyRows: Math.max(0, Number(runSummaryRecord.readyRows ?? 0)),
      blockedRows: Math.max(0, Number(runSummaryRecord.blockedRows ?? 0)),
      skippedRows: Math.max(0, Number(runSummaryRecord.skippedRows ?? 0)),
      readyGroups: Math.max(0, Number(runSummaryRecord.readyGroups ?? 0)),
      blockedGroups: Math.max(0, Number(runSummaryRecord.blockedGroups ?? 0)),
      createMissing: Boolean(run.create_missing),
    };

    const runCanApply =
      typeof run.can_apply === "boolean"
        ? run.can_apply
        : Number(run.blocking_count) === 0 && summary.readyGroups > 0;

    if (run.status === "applied") {
      const rowResults = await readRunRowResults(supabase, parsed.runId);
      const blockingErrors = buildBlockingErrors(rowResults);
      if (typeof run.result !== "object" || !run.result) {
        throw new ApiError(
          500,
          "Applied pricing import run has an invalid stored result payload",
        );
      }
      if ("error" in run.result) {
        throw new ApiError(400, String((run.result as any).error));
      }
      const applyResult = run.result as ImportApplyResult;
      return {
        runId: parsed.runId,
        summary,
        rowResults,
        blockingErrors,
        warnings: [],
        canApply: runCanApply,
        applyResult,
      };
    }

    if (run.status === "failed") {
      throw new ApiError(
        400,
        "Import run is marked as failed. Generate a new preview run before applying.",
      );
    }

    ensureCreateMissingPermission(Boolean(run.create_missing), actor);

    if (Number(run.blocking_count) > 0) {
      throw new ApiError(
        400,
        "Import run has blocking rows. Run a clean preview before applying.",
      );
    }

    if (!runCanApply) {
      throw new ApiError(
        400,
        "Import run is not ready to apply. Run a clean preview before applying.",
      );
    }

    const { data: applyData, error: applyError } = await (supabase as any).rpc(
      "apply_operations_pricing_import",
      {
        p_run_id: parsed.runId,
        p_actor_id: actor?.profileId ?? actor?.userId ?? null,
        p_create_missing: Boolean(run.create_missing),
      },
    );

    if (applyError) {
      throw new ApiError(
        500,
        "Failed to apply pricing import run",
        applyError.message,
      );
    }

    if (!applyData || typeof applyData !== "object") {
      throw new ApiError(
        500,
        "Pricing import apply returned an invalid payload",
      );
    }

    const rpcResponse = applyData as ImportApplyRpcResponse;
    if ("error" in rpcResponse) {
      throw new ApiError(400, rpcResponse.error);
    }

    const rowResults = await readRunRowResults(supabase, parsed.runId);
    const blockingErrors = buildBlockingErrors(rowResults);

    return {
      runId: parsed.runId,
      summary,
      rowResults,
      blockingErrors,
      warnings: [],
      canApply: runCanApply,
      applyResult: rpcResponse,
    };
  },

  async deletePriceList(priceListId: unknown) {
    const parsedId = z.string().uuid().parse(priceListId);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("service_provider_procedure_price_lists")
      .delete()
      .eq("id", parsedId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to delete provider price list",
        error.message,
      );
    }

    if (!data) {
      throw new ApiError(404, "Provider price list not found");
    }

    return { success: true };
  },
};
