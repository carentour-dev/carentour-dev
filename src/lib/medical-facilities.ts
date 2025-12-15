import type { Database } from "@/integrations/supabase/types";

export type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];

export type ProcedureOption = {
  id: string;
  name: string;
  treatmentName: string | null;
};

export type MedicalFacilityDetail = {
  provider: ServiceProviderRow;
  procedures: ProcedureOption[];
};

export const FALLBACK_FACILITY_IMAGE = "/placeholder.svg";

export const formatFacilityLocation = (provider: ServiceProviderRow) => {
  const address = (provider.address ?? {}) as Record<string, unknown>;
  const city =
    (provider.city as string) ?? (address["city"] as string) ?? undefined;
  const country =
    (provider.country_code as string) ??
    (address["country"] as string) ??
    undefined;

  return [city, country].filter(Boolean).join(", ");
};

export const pickFacilityImage = (provider: ServiceProviderRow) => {
  const images = provider.images as Record<string, unknown> | null;
  const hero =
    images && typeof images === "object"
      ? ((images["hero"] as string) ?? null)
      : null;

  const gallery = Array.isArray(provider.gallery_urls)
    ? provider.gallery_urls.filter(Boolean)
    : [];

  return hero ?? gallery[0] ?? provider.logo_url ?? FALLBACK_FACILITY_IMAGE;
};

export const buildProcedureMap = (procedures: ProcedureOption[]) => {
  const map = new Map<string, ProcedureOption>();
  procedures.forEach((procedure) => {
    map.set(procedure.id, procedure);
  });
  return map;
};

export const getProceduresForProvider = (
  provider: ServiceProviderRow,
  proceduresMap: Map<string, ProcedureOption>,
): ProcedureOption[] => {
  const ids = Array.isArray(provider.procedure_ids)
    ? provider.procedure_ids.filter(Boolean)
    : [];

  return ids
    .map((id) => proceduresMap.get(id))
    .filter(Boolean) as ProcedureOption[];
};
