import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";

const facilitiesService = new CrudService("facilities", "facility");

const jsonRecord = z.record(z.unknown()).optional();
const stringArray = z
  .string()
  .array()
  .optional();

const createFacilitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  facility_type: z.string().min(2),
  description: z.string().optional(),
  address: jsonRecord,
  contact_info: jsonRecord,
  coordinates: jsonRecord,
  amenities: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  images: z.any().optional(),
  is_partner: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
});

const updateFacilitySchema = createFacilitySchema.partial();
const facilityIdSchema = z.string().uuid();

type ParsedFacility = z.infer<typeof createFacilitySchema>;

function normalizeFacility(payload: ParsedFacility) {
  return {
    ...payload,
    description: payload.description ?? null,
    address: payload.address ?? null,
    contact_info: payload.contact_info ?? null,
    coordinates: payload.coordinates ?? null,
    amenities: payload.amenities ?? [],
    specialties: payload.specialties ?? [],
    images: payload.images ?? null,
    is_partner: payload.is_partner ?? true,
    rating: payload.rating ?? null,
    review_count: payload.review_count ?? null,
  };
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
    return facilitiesService.create(normalizeFacility(parsed));
  },

  async update(id: unknown, payload: unknown) {
    const facilityId = facilityIdSchema.parse(id);
    const parsed = updateFacilitySchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return facilitiesService.update(facilityId, normalizeFacility(parsed as ParsedFacility));
  },

  async delete(id: unknown) {
    const facilityId = facilityIdSchema.parse(id);
    return facilitiesService.remove(facilityId);
  },
};
