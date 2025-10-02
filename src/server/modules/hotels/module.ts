import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";

const hotelsService = new CrudService("hotels", "hotel");

const createHotelSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  star_rating: z.coerce.number().int().min(1).max(5),
  nightly_rate: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  distance_to_facility_km: z.coerce.number().min(0).optional(),
  address: z.record(z.unknown()).optional(),
  contact_info: z.record(z.unknown()).optional(),
  coordinates: z.record(z.unknown()).optional(),
  amenities: z.array(z.string()).optional(),
  medical_services: z.array(z.string()).optional(),
  images: z.any().optional(),
  is_partner: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
});

const updateHotelSchema = createHotelSchema.partial();
const hotelIdSchema = z.string().uuid();

type ParsedHotel = z.infer<typeof createHotelSchema>;

function normalizeHotel(payload: ParsedHotel) {
  return {
    ...payload,
    description: payload.description ?? null,
    nightly_rate: payload.nightly_rate ?? null,
    currency: payload.currency ?? null,
    distance_to_facility_km: payload.distance_to_facility_km ?? null,
    address: payload.address ?? null,
    contact_info: payload.contact_info ?? null,
    coordinates: payload.coordinates ?? null,
    amenities: payload.amenities ?? [],
    medical_services: payload.medical_services ?? [],
    images: payload.images ?? null,
    is_partner: payload.is_partner ?? true,
    rating: payload.rating ?? null,
    review_count: payload.review_count ?? null,
  };
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
    return hotelsService.create(normalizeHotel(parsed));
  },

  async update(id: unknown, payload: unknown) {
    const hotelId = hotelIdSchema.parse(id);
    const parsed = updateHotelSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return hotelsService.update(hotelId, normalizeHotel(parsed as ParsedHotel));
  },

  async delete(id: unknown) {
    const hotelId = hotelIdSchema.parse(id);
    return hotelsService.remove(hotelId);
  },
};
