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

    const searchTerm = cleanSearchTerm(parsed.search);
    if (searchTerm) {
      query = query.or(
        [
          `name.ilike.${searchTerm}`,
          `city.ilike.${searchTerm}`,
          `country_code.ilike.${searchTerm}`,
          `facility_type.ilike.${searchTerm}`,
        ].join(","),
      );
    }

    if (parsed.limit) {
      query = query.limit(parsed.limit);
    }

    const { data, error } = await query.order("rating", { ascending: false });

    if (error) {
      throw error;
    }

    const providers = data ?? [];

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
        .in("id", distinctProcedureIds);

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
    }

    return jsonResponse({
      providers,
      filters: {
        countries: Array.from(countries).sort((a, b) => a.localeCompare(b)),
        cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
        procedures: procedureMeta.sort((a, b) => a.name.localeCompare(b.name)),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
};
