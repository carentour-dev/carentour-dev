import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import type { Json } from "@/integrations/supabase/types";

const facilitiesService = new CrudService("facilities", "facility");

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

const createFacilitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  facility_type: z.string().min(2),
  description: z.string().optional(),
  address: jsonRecord,
  contact_info: jsonRecord,
  coordinates: jsonRecord,
  amenities: stringArray,
  specialties: stringArray,
  images: jsonRecord,
  is_partner: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
});

const updateFacilitySchema = createFacilitySchema.partial();
const facilityIdSchema = z.string().uuid();

type ParsedFacility = z.infer<typeof createFacilitySchema>;

const trimString = (value: string) => value.trim();

const sanitizeStringArray = (values: string[] | undefined) =>
  Array.isArray(values)
    ? values
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : undefined;

function normalizeFacilityForCreate(payload: ParsedFacility) {
  return {
    name: trimString(payload.name),
    slug: trimString(payload.slug),
    facility_type: trimString(payload.facility_type),
    description: payload.description?.trim() ?? null,
    address: payload.address ?? null,
    contact_info: payload.contact_info ?? null,
    coordinates: payload.coordinates ?? null,
    amenities: sanitizeStringArray(payload.amenities) ?? [],
    specialties: sanitizeStringArray(payload.specialties) ?? [],
    images: (payload.images as Json | null | undefined) ?? null,
    is_partner: payload.is_partner ?? true,
    rating: payload.rating ?? null,
    review_count: payload.review_count ?? null,
  };
}

function normalizeFacilityForUpdate(payload: Partial<ParsedFacility>) {
  const sanitized: Record<string, unknown> = {};

  if (payload.name !== undefined) sanitized.name = trimString(payload.name);
  if (payload.slug !== undefined) sanitized.slug = trimString(payload.slug);
  if (payload.facility_type !== undefined) sanitized.facility_type = trimString(payload.facility_type);
  if (payload.description !== undefined)
    sanitized.description = payload.description?.trim() ?? null;
  if (payload.address !== undefined) sanitized.address = payload.address ?? null;
  if (payload.contact_info !== undefined) sanitized.contact_info = payload.contact_info ?? null;
  if (payload.coordinates !== undefined) sanitized.coordinates = payload.coordinates ?? null;
  if (payload.amenities !== undefined)
    sanitized.amenities = sanitizeStringArray(payload.amenities) ?? [];
  if (payload.specialties !== undefined)
    sanitized.specialties = sanitizeStringArray(payload.specialties) ?? [];
  if (payload.images !== undefined)
    sanitized.images = (payload.images as Json | null | undefined) ?? null;
  if (payload.is_partner !== undefined) sanitized.is_partner = payload.is_partner;
  if (payload.rating !== undefined) sanitized.rating = payload.rating ?? null;
  if (payload.review_count !== undefined) sanitized.review_count = payload.review_count ?? null;

  return sanitized;
}

export const facilityController = {
  async list() {
    return facilitiesService.list();
  },

  async get(id: unknown) {
    const facilityId = facilityIdSchema.parse(id);
    return facilitiesService.getById(facilityId);
  },

  async create(payload: unknown) {
    const parsed = createFacilitySchema.parse(payload);
    return facilitiesService.create(normalizeFacilityForCreate(parsed));
  },

  async update(id: unknown, payload: unknown) {
    const facilityId = facilityIdSchema.parse(id);
    const parsed = updateFacilitySchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const sanitizedUpdate = normalizeFacilityForUpdate(parsed as ParsedFacility);

    if (Object.keys(sanitizedUpdate).length === 0) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    return facilitiesService.update(facilityId, sanitizedUpdate);
  },

  async delete(id: unknown) {
    const facilityId = facilityIdSchema.parse(id);
    return facilitiesService.remove(facilityId);
  },
};
