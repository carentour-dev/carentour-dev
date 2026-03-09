import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { financeCounterpartySync } from "@/server/modules/finance/counterpartySync";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import type { Json } from "@/integrations/supabase/types";

const serviceProvidersService = new CrudService(
  "service_providers",
  "service provider",
);

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const jsonRecord = jsonSchema.optional();
const stringArray = z.array(z.string()).optional();
const nullableString = z.string().optional().nullable();
const nullableRating = z.coerce.number().min(0).max(5).optional().nullable();
const nullableReviewCount = z.coerce
  .number()
  .int()
  .min(0)
  .optional()
  .nullable();

const createServiceProviderSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  facility_type: z.string().min(2),
  country_code: nullableString,
  city: nullableString,
  description: nullableString,
  overview: nullableString,
  address: jsonRecord,
  contact_info: jsonRecord,
  coordinates: jsonRecord,
  amenities: stringArray,
  specialties: stringArray,
  facilities: stringArray,
  infrastructure: jsonRecord,
  logo_url: z.string().optional().nullable(),
  gallery_urls: stringArray,
  procedure_ids: stringArray,
  images: jsonRecord,
  is_partner: z.boolean().optional().nullable(),
  rating: nullableRating,
  review_count: nullableReviewCount,
});

const updateServiceProviderSchema = createServiceProviderSchema.partial();
const serviceProviderIdSchema = z.string().uuid();

type ParsedServiceProvider = z.infer<typeof createServiceProviderSchema>;

const trimString = (value: string) => value.trim();

const sanitizeStringArray = (values: string[] | undefined) =>
  Array.isArray(values)
    ? values.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
    : undefined;

function normalizeServiceProviderForCreate(payload: ParsedServiceProvider) {
  return {
    name: trimString(payload.name),
    slug: trimString(payload.slug),
    facility_type: trimString(payload.facility_type),
    country_code: payload.country_code?.trim() ?? null,
    city: payload.city?.trim() ?? null,
    description: payload.description?.trim() ?? null,
    overview: payload.overview?.trim() ?? null,
    address: payload.address ?? null,
    contact_info: payload.contact_info ?? null,
    coordinates: payload.coordinates ?? null,
    amenities: sanitizeStringArray(payload.amenities) ?? [],
    specialties: sanitizeStringArray(payload.specialties) ?? [],
    facilities: sanitizeStringArray(payload.facilities) ?? [],
    infrastructure: payload.infrastructure ?? null,
    logo_url:
      typeof payload.logo_url === "string" && payload.logo_url.trim().length > 0
        ? payload.logo_url.trim()
        : null,
    gallery_urls: sanitizeStringArray(payload.gallery_urls) ?? [],
    procedure_ids: sanitizeStringArray(payload.procedure_ids) ?? [],
    images: (payload.images as Json | null | undefined) ?? null,
    is_partner: payload.is_partner ?? true,
    rating: payload.rating ?? null,
    review_count: payload.review_count ?? null,
  };
}

function normalizeServiceProviderForUpdate(
  payload: Partial<ParsedServiceProvider>,
) {
  const sanitized: Record<string, unknown> = {};

  if (payload.name !== undefined) sanitized.name = trimString(payload.name);
  if (payload.slug !== undefined) sanitized.slug = trimString(payload.slug);
  if (payload.facility_type !== undefined)
    sanitized.facility_type = trimString(payload.facility_type);
  if (payload.description !== undefined)
    sanitized.description = payload.description?.trim() ?? null;
  if (payload.address !== undefined)
    sanitized.address = payload.address ?? null;
  if (payload.contact_info !== undefined)
    sanitized.contact_info = payload.contact_info ?? null;
  if (payload.country_code !== undefined)
    sanitized.country_code = payload.country_code?.trim() ?? null;
  if (payload.city !== undefined) sanitized.city = payload.city?.trim() ?? null;
  if (payload.overview !== undefined)
    sanitized.overview = payload.overview?.trim() ?? null;
  if (payload.facilities !== undefined)
    sanitized.facilities = sanitizeStringArray(payload.facilities) ?? [];
  if (payload.infrastructure !== undefined)
    sanitized.infrastructure = payload.infrastructure ?? null;
  if (payload.logo_url !== undefined)
    sanitized.logo_url =
      typeof payload.logo_url === "string" && payload.logo_url.trim().length > 0
        ? payload.logo_url.trim()
        : null;
  if (payload.gallery_urls !== undefined)
    sanitized.gallery_urls = sanitizeStringArray(payload.gallery_urls) ?? [];
  if (payload.procedure_ids !== undefined)
    sanitized.procedure_ids = sanitizeStringArray(payload.procedure_ids) ?? [];
  if (payload.coordinates !== undefined)
    sanitized.coordinates = payload.coordinates ?? null;
  if (payload.amenities !== undefined)
    sanitized.amenities = sanitizeStringArray(payload.amenities) ?? [];
  if (payload.specialties !== undefined)
    sanitized.specialties = sanitizeStringArray(payload.specialties) ?? [];
  if (payload.images !== undefined)
    sanitized.images = (payload.images as Json | null | undefined) ?? null;
  if (payload.is_partner !== undefined)
    sanitized.is_partner = payload.is_partner;
  if (payload.rating !== undefined) sanitized.rating = payload.rating ?? null;
  if (payload.review_count !== undefined)
    sanitized.review_count = payload.review_count ?? null;

  return sanitized;
}

export const serviceProviderController = {
  async list() {
    return serviceProvidersService.list();
  },

  async get(id: unknown) {
    const serviceProviderId = serviceProviderIdSchema.parse(id);
    return serviceProvidersService.getById(serviceProviderId);
  },

  async create(payload: unknown) {
    const parsed = createServiceProviderSchema.parse(payload);
    const created = await serviceProvidersService.create(
      normalizeServiceProviderForCreate(parsed),
    );

    financeCounterpartySync
      .syncServiceProviderEvent(created.id)
      .catch((error) =>
        console.error(
          "[finance][counterparty-sync][service-provider][create]",
          {
            serviceProviderId: created.id,
            error,
          },
        ),
      );

    return created;
  },

  async update(id: unknown, payload: unknown) {
    const serviceProviderId = serviceProviderIdSchema.parse(id);
    const parsed = updateServiceProviderSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const sanitizedUpdate = normalizeServiceProviderForUpdate(
      parsed as ParsedServiceProvider,
    );

    if (Object.keys(sanitizedUpdate).length === 0) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    if (sanitizedUpdate.procedure_ids !== undefined) {
      const supabase = getSupabaseAdmin();

      const { data: existingProvider, error: existingProviderError } =
        await supabase
          .from("service_providers")
          .select("procedure_ids")
          .eq("id", serviceProviderId)
          .maybeSingle();

      if (existingProviderError) {
        throw new ApiError(
          500,
          "Failed to load provider procedure links before update",
          existingProviderError.message,
        );
      }

      if (!existingProvider) {
        throw new ApiError(404, "Service provider not found");
      }

      const existingProcedureIds = (
        Array.isArray(existingProvider.procedure_ids)
          ? existingProvider.procedure_ids
          : []
      ).filter((entry): entry is string => typeof entry === "string");

      const nextProcedureIds = (
        Array.isArray(sanitizedUpdate.procedure_ids)
          ? sanitizedUpdate.procedure_ids
          : []
      ).filter((entry): entry is string => typeof entry === "string");

      const nextProcedureIdSet = new Set(nextProcedureIds);
      const removedProcedureIds = existingProcedureIds.filter(
        (entry) => !nextProcedureIdSet.has(entry),
      );

      if (removedProcedureIds.length > 0) {
        const { data: blockingPriceLists, error: blockingPriceListsError } =
          await supabase
            .from("service_provider_procedure_price_lists")
            .select("procedure_id")
            .eq("service_provider_id", serviceProviderId)
            .in("procedure_id", removedProcedureIds);

        if (blockingPriceListsError) {
          throw new ApiError(
            500,
            "Failed to validate procedure unlink against price lists",
            blockingPriceListsError.message,
          );
        }

        const blockedProcedureIds = Array.from(
          new Set(
            (blockingPriceLists ?? [])
              .map((entry) => entry.procedure_id)
              .filter((entry): entry is string => typeof entry === "string"),
          ),
        );

        if (blockedProcedureIds.length > 0) {
          const { data: blockedProcedures, error: blockedProceduresError } =
            await supabase
              .from("treatment_procedures")
              .select("id, name")
              .in("id", blockedProcedureIds);

          if (blockedProceduresError) {
            throw new ApiError(
              500,
              "Failed to resolve procedure names for unlink guard",
              blockedProceduresError.message,
            );
          }

          const procedureNameById = new Map<string, string>();
          for (const entry of blockedProcedures ?? []) {
            procedureNameById.set(entry.id, entry.name);
          }

          const blockedProcedureLabels = blockedProcedureIds.map((entry) => {
            const name = procedureNameById.get(entry);
            return name ? `${name} (${entry})` : entry;
          });

          throw new ApiError(
            409,
            "Cannot unlink procedures while provider price lists exist",
            `Delete provider price list(s) first for: ${blockedProcedureLabels.join(", ")}`,
          );
        }
      }
    }

    const updated = await serviceProvidersService.update(
      serviceProviderId,
      sanitizedUpdate,
    );

    financeCounterpartySync
      .syncServiceProviderEvent(serviceProviderId)
      .catch((error) =>
        console.error(
          "[finance][counterparty-sync][service-provider][update]",
          {
            serviceProviderId,
            error,
          },
        ),
      );

    return updated;
  },

  async delete(id: unknown) {
    const serviceProviderId = serviceProviderIdSchema.parse(id);
    let linkedCounterpartyIds: string[] = [];

    try {
      linkedCounterpartyIds =
        await financeCounterpartySync.captureServiceProviderLinkedCounterparties(
          serviceProviderId,
        );
    } catch (error) {
      console.error(
        "[finance][counterparty-sync][service-provider][delete][capture]",
        {
          serviceProviderId,
          error,
        },
      );
    }

    const result = await serviceProvidersService.remove(serviceProviderId);

    financeCounterpartySync
      .deactivateServiceProviderLink(serviceProviderId, {
        counterpartyIds: linkedCounterpartyIds,
      })
      .catch((error) =>
        console.error(
          "[finance][counterparty-sync][service-provider][delete]",
          {
            serviceProviderId,
            error,
          },
        ),
      );

    return result;
  },
};
