import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";

const doctorServiceInstance = new CrudService("doctors", "doctor");

const avatarUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/"),
    {
      message: "Invalid URL",
    },
  );

const doctorFields = {
  name: z.string().min(2),
  title: z.string().min(2),
  specialization: z.string().min(2),
  bio: z.string().max(4000).optional(),
  experience_years: z.coerce.number().int().min(0),
  education: z.string().optional(),
  languages: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  patient_rating: z.coerce.number().min(0).max(5).optional(),
  total_reviews: z.coerce.number().int().min(0).optional(),
  successful_procedures: z.coerce.number().int().min(0).optional(),
  research_publications: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  avatar_url: avatarUrlSchema.nullable().optional(),
};

const createDoctorSchema = z.object(doctorFields);
const updateDoctorSchema = z.object(doctorFields).partial();
const doctorIdSchema = z.string().uuid();

export const doctorService = doctorServiceInstance;

export const doctorController = {
  async list() {
    return doctorService.list();
  },

  async get(id: unknown) {
    const doctorId = doctorIdSchema.parse(id);
    return doctorService.getById(doctorId);
  },

  async create(payload: unknown) {
    const parsed = createDoctorSchema.parse(payload);

    return doctorService.create({
      ...parsed,
      languages: parsed.languages ?? [],
      achievements: parsed.achievements ?? [],
      certifications: parsed.certifications ?? [],
      successful_procedures: parsed.successful_procedures ?? 0,
      research_publications: parsed.research_publications ?? 0,
      avatar_url:
        typeof parsed.avatar_url === "string" && parsed.avatar_url.trim().length > 0
          ? parsed.avatar_url.trim()
          : null,
    });
  },

  async update(id: unknown, payload: unknown) {
    const doctorId = doctorIdSchema.parse(id);
    const parsed = updateDoctorSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const payloadForUpdate = {
      ...parsed,
      avatar_url:
        typeof parsed.avatar_url === "string"
          ? parsed.avatar_url.trim().length > 0
            ? parsed.avatar_url.trim()
            : null
          : parsed.avatar_url,
    };

    return doctorService.update(doctorId, payloadForUpdate);
  },

  async delete(id: unknown) {
    const doctorId = doctorIdSchema.parse(id);
    return doctorService.remove(doctorId);
  },
};
