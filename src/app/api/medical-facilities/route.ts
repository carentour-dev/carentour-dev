import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { handleRouteError, jsonResponse } from "@/server/utils/http";

const querySchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  specialty: z.string().optional(),
  procedureId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

type ProcedureMeta = {
  id: string;
  name: string;
  treatmentName: string | null;
};

const cleanSearchTerm = (value: string | undefined | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return `%${trimmed.replace(/[%_]/g, "").slice(0, 100)}%`;
};

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const parsed = querySchema.parse({
      country: searchParams.get("country") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      specialty: searchParams.get("specialty") ?? undefined,
      procedureId: searchParams.get("procedureId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const supabase = getSupabaseAdmin();

    const searchTerm = cleanSearchTerm(parsed.search);

    const procedureSearchIds = new Set<string>();

    if (searchTerm) {
      const [procedureNameMatches, treatmentNameMatches] = await Promise.all([
        supabase
          .from("treatment_procedures")
          .select("id")
          .eq("is_public", true)
          .ilike("name", searchTerm),
        supabase
          .from("treatment_procedures")
          .select("id, treatments!inner(name)")
          .eq("is_public", true)
          .ilike("treatments.name", searchTerm),
      ]);

      if (procedureNameMatches.error) {
        throw procedureNameMatches.error;
      }

      if (treatmentNameMatches.error) {
        throw treatmentNameMatches.error;
      }

      procedureNameMatches.data?.forEach((match) => {
        if (match?.id) {
          procedureSearchIds.add(match.id);
        }
      });

      treatmentNameMatches.data?.forEach((match) => {
        if (match?.id) {
          procedureSearchIds.add(match.id);
        }
      });
    }

    let query = supabase
      .from("service_providers")
      .select("*")
      .or("is_partner.is.null,is_partner.eq.true");

    if (parsed.country) {
      query = query.ilike("country_code", parsed.country.trim());
    }

    if (parsed.city) {
      query = query.ilike("city", parsed.city.trim());
    }

    if (parsed.specialty) {
      query = query.contains("specialties", [parsed.specialty.trim()]);
    }

    if (parsed.procedureId) {
      query = query.contains("procedure_ids", [parsed.procedureId]);
    }

    // For search, we need to handle specialty matching separately since PostgREST
    // doesn't support partial matching (ilike) on array columns
    const searchLower = parsed.search?.trim().toLowerCase() ?? "";

    if (parsed.limit) {
      query = query.limit(parsed.limit);
    }

    const { data, error } = await query.order("rating", { ascending: false });

    if (error) {
      throw error;
    }

    let providers = data ?? [];

    // Apply search filter client-side to support specialty partial matching
    if (searchTerm && searchLower) {
      providers = providers.filter((provider) => {
        // Check name
        if (
          provider.name &&
          (provider.name as string).toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Check city
        if (
          provider.city &&
          (provider.city as string).toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Check country_code
        if (
          provider.country_code &&
          (provider.country_code as string).toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Check facility_type
        if (
          provider.facility_type &&
          (provider.facility_type as string).toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Check specialties (partial match)
        const specialtiesArr = provider.specialties as string[] | null;
        if (Array.isArray(specialtiesArr)) {
          if (
            specialtiesArr.some((spec) =>
              spec.toLowerCase().includes(searchLower),
            )
          ) {
            return true;
          }
        }

        // Check procedure IDs
        if (procedureSearchIds.size > 0) {
          const providerProcedureIds = provider.procedure_ids as
            | string[]
            | null;
          if (Array.isArray(providerProcedureIds)) {
            if (
              providerProcedureIds.some((id) => procedureSearchIds.has(id))
            ) {
              return true;
            }
          }
        }

        return false;
      });
    }

    const distinctProcedureIds = Array.from(
      new Set(
        providers.flatMap((provider) =>
          Array.isArray(provider.procedure_ids)
            ? provider.procedure_ids.filter(Boolean)
            : [],
        ),
      ),
    );

    let procedureMeta: ProcedureMeta[] = [];

    if (distinctProcedureIds.length > 0) {
      const { data: procedureRows, error: procedureError } = await supabase
        .from("treatment_procedures")
        .select("id, name, treatment_id, treatments(name)")
        .in("id", distinctProcedureIds)
        .eq("is_public", true);

      if (procedureError) {
        throw procedureError;
      }

      procedureMeta =
        procedureRows?.map((row) => ({
          id: row.id,
          name: row.name,
          treatmentName:
            (row as { treatments?: { name?: string } })?.treatments?.name ??
            null,
        })) ?? [];
    }

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
        providerSpecialties.forEach((spec) => {
          if (spec && spec.trim()) {
            specialties.add(spec.trim());
          }
        });
      }
    }

    return jsonResponse({
      providers,
      filters: {
        countries: Array.from(countries).sort((a, b) => a.localeCompare(b)),
        cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
        specialties: Array.from(specialties).sort((a, b) => a.localeCompare(b)),
        procedures: procedureMeta.sort((a, b) => a.name.localeCompare(b.name)),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
};
