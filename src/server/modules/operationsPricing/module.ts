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
