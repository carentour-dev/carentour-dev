import { cache } from "react";
import {
  buildMedicalFacilitiesDirectoryState,
  getDistinctMedicalFacilityProcedureIds,
  type MedicalFacilitiesDirectoryFilters,
  type MedicalFacilitiesDirectoryResponse,
  type MedicalFacilityDetail,
  type ProcedureOption,
  type ServiceProviderRow,
} from "@/lib/medical-facilities";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

function mapProcedureOptions(
  rows:
    | Array<{ id: string; name: string; treatments?: { name?: string } | null }>
    | null
    | undefined,
): ProcedureOption[] {
  return (
    rows?.map((row) => ({
      id: row.id,
      name: row.name,
      treatmentName: row.treatments?.name ?? null,
    })) ?? []
  );
}

const fetchAllPublicServiceProviders = cache(
  async (): Promise<ServiceProviderRow[]> => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("service_providers")
      .select("*")
      .or("is_partner.is.null,is_partner.eq.true")
      .order("rating", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as ServiceProviderRow[];
  },
);

const fetchPublicProcedureOptionsByIds = cache(async (idsKey: string) => {
  const ids = idsKey
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return [] as ProcedureOption[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_procedures")
    .select("id, name, treatment_id, treatments(name)")
    .in("id", ids)
    .eq("is_public", true);

  if (error) {
    throw error;
  }

  return mapProcedureOptions(
    (data ?? []) as Array<{
      id: string;
      name: string;
      treatments?: { name?: string } | null;
    }>,
  );
});

export async function fetchPublicMedicalFacilitiesDirectory(
  filters: MedicalFacilitiesDirectoryFilters = {},
): Promise<MedicalFacilitiesDirectoryResponse> {
  const providers = await fetchAllPublicServiceProviders();
  const procedureIds = getDistinctMedicalFacilityProcedureIds(providers).sort();
  const procedures = await fetchPublicProcedureOptionsByIds(
    procedureIds.join(","),
  );

  return buildMedicalFacilitiesDirectoryState({
    providers,
    procedures,
    filters,
  });
}

export const fetchPublicServiceProviderBySlug = cache(
  async (slug: string): Promise<MedicalFacilityDetail | null> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) {
      return null;
    }

    const supabase = getSupabaseAdmin();

    const { data: provider, error } = await supabase
      .from("service_providers")
      .select("*")
      .eq("slug", trimmedSlug)
      .or("is_partner.is.null,is_partner.eq.true")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!provider) {
      return null;
    }

    const procedureIds = Array.isArray(provider.procedure_ids)
      ? provider.procedure_ids.filter(Boolean)
      : [];

    let procedures: ProcedureOption[] = [];

    if (procedureIds.length > 0) {
      const { data: rows, error: procedureError } = await supabase
        .from("treatment_procedures")
        .select("id, name, treatment_id, treatments(name)")
        .in("id", procedureIds)
        .eq("is_public", true);

      if (procedureError) {
        throw procedureError;
      }

      procedures = mapProcedureOptions(
        rows as Array<{
          id: string;
          name: string;
          treatments?: { name?: string } | null;
        }>,
      );
    }

    return { provider, procedures };
  },
);
