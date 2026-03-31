import type { Database } from "@/integrations/supabase/types";

export type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];

export type MedicalFacilitiesDirectoryFilters = {
  search?: string;
  country?: string;
  city?: string;
  specialty?: string;
  procedureId?: string;
  limit?: number;
};

export type ProcedureOption = {
  id: string;
  name: string;
  treatmentName: string | null;
};

export type MedicalFacilitiesDirectoryFilterMeta = {
  countries: string[];
  cities: string[];
  specialties: string[];
  procedures: ProcedureOption[];
};

export type MedicalFacilitiesDirectoryResponse = {
  providers: ServiceProviderRow[];
  filters: MedicalFacilitiesDirectoryFilterMeta;
};

export type MedicalFacilityDetail = {
  provider: ServiceProviderRow;
  procedures: ProcedureOption[];
};

export const FALLBACK_FACILITY_IMAGE = "/placeholder.svg";

const normalizeCaseInsensitive = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeTrimmed = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim() : "";

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

export const getDistinctMedicalFacilityProcedureIds = (
  providers: ServiceProviderRow[],
) =>
  Array.from(
    new Set(
      providers.flatMap((provider) =>
        Array.isArray(provider.procedure_ids)
          ? provider.procedure_ids.filter(Boolean)
          : [],
      ),
    ),
  );

export const buildProcedureMap = (procedures: ProcedureOption[]) => {
  const map = new Map<string, ProcedureOption>();
  procedures.forEach((procedure) => {
    map.set(procedure.id, procedure);
  });
  return map;
};

export const matchesMedicalFacilitySearch = (
  provider: ServiceProviderRow,
  searchTerm: string,
  procedureSearchIds: Set<string>,
) => {
  if (!searchTerm) {
    return true;
  }

  if (normalizeCaseInsensitive(provider.name).includes(searchTerm)) {
    return true;
  }

  if (normalizeCaseInsensitive(provider.city).includes(searchTerm)) {
    return true;
  }

  if (normalizeCaseInsensitive(provider.country_code).includes(searchTerm)) {
    return true;
  }

  if (normalizeCaseInsensitive(provider.facility_type).includes(searchTerm)) {
    return true;
  }

  const specialtiesArr = provider.specialties as string[] | null;
  if (
    Array.isArray(specialtiesArr) &&
    specialtiesArr.some((specialty) =>
      specialty.toLowerCase().includes(searchTerm),
    )
  ) {
    return true;
  }

  const providerProcedureIds = provider.procedure_ids as string[] | null;
  if (
    procedureSearchIds.size > 0 &&
    Array.isArray(providerProcedureIds) &&
    providerProcedureIds.some((id) => procedureSearchIds.has(id))
  ) {
    return true;
  }

  return false;
};

export function buildMedicalFacilitiesDirectoryState(input: {
  providers: ServiceProviderRow[];
  procedures: ProcedureOption[];
  filters?: MedicalFacilitiesDirectoryFilters;
}): MedicalFacilitiesDirectoryResponse {
  const filters = input.filters ?? {};
  const normalizedCountry = normalizeCaseInsensitive(filters.country);
  const normalizedCity = normalizeCaseInsensitive(filters.city);
  const specialtyFilter = normalizeTrimmed(filters.specialty);
  const procedureIdFilter = normalizeTrimmed(filters.procedureId);
  const searchTerm = normalizeCaseInsensitive(filters.search);

  const procedureSearchIds = new Set(
    input.procedures
      .filter((procedure) => {
        if (!searchTerm) {
          return false;
        }

        return (
          procedure.name.toLowerCase().includes(searchTerm) ||
          (procedure.treatmentName ?? "").toLowerCase().includes(searchTerm)
        );
      })
      .map((procedure) => procedure.id),
  );

  let providers = input.providers.filter((provider) => {
    if (
      normalizedCountry &&
      normalizeCaseInsensitive(provider.country_code) !== normalizedCountry
    ) {
      return false;
    }

    if (
      normalizedCity &&
      normalizeCaseInsensitive(provider.city) !== normalizedCity
    ) {
      return false;
    }

    if (
      specialtyFilter &&
      !(
        Array.isArray(provider.specialties) &&
        provider.specialties.includes(specialtyFilter)
      )
    ) {
      return false;
    }

    if (
      procedureIdFilter &&
      !(
        Array.isArray(provider.procedure_ids) &&
        provider.procedure_ids.includes(procedureIdFilter)
      )
    ) {
      return false;
    }

    return true;
  });

  if (typeof filters.limit === "number" && filters.limit > 0) {
    providers = providers.slice(0, filters.limit);
  }

  if (searchTerm) {
    providers = providers.filter((provider) =>
      matchesMedicalFacilitySearch(provider, searchTerm, procedureSearchIds),
    );
  }

  const distinctProcedureIds = new Set(
    getDistinctMedicalFacilityProcedureIds(providers),
  );
  const procedures = input.procedures
    .filter((procedure) => distinctProcedureIds.has(procedure.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const countries = new Set<string>();
  const cities = new Set<string>();
  const specialties = new Set<string>();

  for (const provider of providers) {
    const address = (provider.address ?? {}) as Record<string, unknown>;
    const city = (provider.city as string) ?? (address["city"] as string);
    const country =
      (provider.country_code as string) ?? (address["country"] as string);

    if (city && city.trim()) {
      cities.add(city.trim());
    }

    if (country && country.trim()) {
      countries.add(country.trim());
    }

    const providerSpecialties = provider.specialties as string[] | null;
    if (Array.isArray(providerSpecialties)) {
      providerSpecialties.forEach((specialty) => {
        if (specialty && specialty.trim()) {
          specialties.add(specialty.trim());
        }
      });
    }
  }

  return {
    providers,
    filters: {
      countries: Array.from(countries).sort((a, b) => a.localeCompare(b)),
      cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
      specialties: Array.from(specialties).sort((a, b) => a.localeCompare(b)),
      procedures,
    },
  };
}

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
