import { cache } from "react";
import {
  type MedicalFacilityDetail,
  type ProcedureOption,
} from "@/lib/medical-facilities";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

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
        .in("id", procedureIds);

      if (procedureError) {
        throw procedureError;
      }

      procedures =
        rows?.map((row) => ({
          id: row.id,
          name: row.name,
          treatmentName:
            (row as { treatments?: { name?: string } })?.treatments?.name ??
            null,
        })) ?? [];
    }

    return { provider, procedures };
  },
);
