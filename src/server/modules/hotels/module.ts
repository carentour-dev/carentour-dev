import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import type { Json } from "@/integrations/supabase/types";

const hotelsService = new CrudService("hotels", "hotel");

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

const createHotelSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  star_rating: z.coerce.number().int().min(1).max(5),
  nightly_rate: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  distance_to_facility_km: z.coerce.number().min(0).optional(),
  address: jsonRecord,
  contact_info: jsonRecord,
  coordinates: jsonRecord,
  amenities: stringArray,
  medical_services: stringArray,
  images: jsonRecord,
  is_partner: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
});

const updateHotelSchema = createHotelSchema.partial();
const hotelIdSchema = z.string().uuid();

type ParsedHotel = z.infer<typeof createHotelSchema>;

const trimString = (value: string) => value.trim();

const sanitizeStringArray = (values: string[] | undefined) =>
  Array.isArray(values)
    ? values
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : undefined;

function normalizeHotelForCreate(payload: ParsedHotel) {
  return {
    name: trimString(payload.name),
    slug: trimString(payload.slug),
    description: payload.description?.trim() ?? null,
    star_rating: payload.star_rating,
    nightly_rate: payload.nightly_rate ?? null,
    currency: payload.currency?.trim() ?? null,
    distance_to_facility_km: payload.distance_to_facility_km ?? null,
    address: payload.address ?? null,
    contact_info: payload.contact_info ?? null,
    coordinates: payload.coordinates ?? null,
    amenities: sanitizeStringArray(payload.amenities) ?? [],
    medical_services: sanitizeStringArray(payload.medical_services) ?? [],
    images: (payload.images as Json | null | undefined) ?? null,
    is_partner: payload.is_partner ?? true,
    rating: payload.rating ?? null,
    review_count: payload.review_count ?? null,
  };
}

function normalizeHotelForUpdate(payload: Partial<ParsedHotel>) {
  const sanitized: Record<string, unknown> = {};

  if (payload.name !== undefined) sanitized.name = trimString(payload.name);
  if (payload.slug !== undefined) sanitized.slug = trimString(payload.slug);
  if (payload.description !== undefined) sanitized.description = payload.description?.trim() ?? null;
  if (payload.star_rating !== undefined) sanitized.star_rating = payload.star_rating;
  if (payload.nightly_rate !== undefined) sanitized.nightly_rate = payload.nightly_rate ?? null;
  if (payload.currency !== undefined) sanitized.currency = payload.currency?.trim() ?? null;
  if (payload.distance_to_facility_km !== undefined)
    sanitized.distance_to_facility_km = payload.distance_to_facility_km ?? null;
  if (payload.address !== undefined) sanitized.address = payload.address ?? null;
  if (payload.contact_info !== undefined) sanitized.contact_info = payload.contact_info ?? null;
  if (payload.coordinates !== undefined) sanitized.coordinates = payload.coordinates ?? null;
  if (payload.amenities !== undefined)
    sanitized.amenities = sanitizeStringArray(payload.amenities) ?? [];
  if (payload.medical_services !== undefined)
    sanitized.medical_services = sanitizeStringArray(payload.medical_services) ?? [];
  if (payload.images !== undefined)
    sanitized.images = (payload.images as Json | null | undefined) ?? null;
  if (payload.is_partner !== undefined) sanitized.is_partner = payload.is_partner;
  if (payload.rating !== undefined) sanitized.rating = payload.rating ?? null;
  if (payload.review_count !== undefined) sanitized.review_count = payload.review_count ?? null;

  return sanitized;
}

export const hotelController = {
  async list() {
    return hotelsService.list();
  },

  async get(id: unknown) {
    const hotelId = hotelIdSchema.parse(id);
    return hotelsService.getById(hotelId);
  },

  async create(payload: unknown) {
    const parsed = createHotelSchema.parse(payload);
    return hotelsService.create(normalizeHotelForCreate(parsed));
  },

  async update(id: unknown, payload: unknown) {
    const hotelId = hotelIdSchema.parse(id);
    const parsed = updateHotelSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const sanitizedUpdate = normalizeHotelForUpdate(parsed as ParsedHotel);

    if (Object.keys(sanitizedUpdate).length === 0) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    return hotelsService.update(hotelId, sanitizedUpdate);
  },

  async delete(id: unknown) {
    const hotelId = hotelIdSchema.parse(id);
    return hotelsService.remove(hotelId);
  },
};
