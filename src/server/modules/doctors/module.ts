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
  education: z.string().min(2),
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

const trimString = (value: string) => value.trim();

const trimOptionalString = (value: string | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeStringArray = (values: string[] | undefined) =>
  Array.isArray(values)
    ? values
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

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

    const createPayload = {
      name: trimString(parsed.name),
      title: trimString(parsed.title),
      specialization: trimString(parsed.specialization),
      bio: trimOptionalString(parsed.bio),
      experience_years: parsed.experience_years,
      education: trimString(parsed.education),
      languages: sanitizeStringArray(parsed.languages),
      achievements: sanitizeStringArray(parsed.achievements),
      certifications: sanitizeStringArray(parsed.certifications),
      patient_rating: parsed.patient_rating ?? null,
      total_reviews: parsed.total_reviews ?? null,
      successful_procedures: parsed.successful_procedures ?? 0,
      research_publications: parsed.research_publications ?? 0,
      is_active: parsed.is_active ?? true,
      avatar_url:
        typeof parsed.avatar_url === "string" && parsed.avatar_url.trim().length > 0
          ? parsed.avatar_url.trim()
          : null,
    } as const;

    return doctorService.create(createPayload);
  },

  async update(id: unknown, payload: unknown) {
    const doctorId = doctorIdSchema.parse(id);
    const parsed = updateDoctorSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const payloadForUpdate: Record<string, unknown> = {
      avatar_url:
        typeof parsed.avatar_url === "string"
          ? parsed.avatar_url.trim().length > 0
            ? parsed.avatar_url.trim()
            : null
          : parsed.avatar_url,
    };

    if (parsed.name !== undefined) payloadForUpdate.name = trimString(parsed.name);
    if (parsed.title !== undefined) payloadForUpdate.title = trimString(parsed.title);
    if (parsed.specialization !== undefined) payloadForUpdate.specialization = trimString(parsed.specialization);
    if (parsed.bio !== undefined) payloadForUpdate.bio = trimOptionalString(parsed.bio);
    if (parsed.education !== undefined) payloadForUpdate.education = trimString(parsed.education);
    if (parsed.languages !== undefined) payloadForUpdate.languages = sanitizeStringArray(parsed.languages);
    if (parsed.achievements !== undefined)
      payloadForUpdate.achievements = sanitizeStringArray(parsed.achievements);
    if (parsed.certifications !== undefined)
      payloadForUpdate.certifications = sanitizeStringArray(parsed.certifications);
    if (parsed.patient_rating !== undefined) payloadForUpdate.patient_rating = parsed.patient_rating;
    if (parsed.total_reviews !== undefined) payloadForUpdate.total_reviews = parsed.total_reviews;
    if (parsed.successful_procedures !== undefined)
      payloadForUpdate.successful_procedures = parsed.successful_procedures;
    if (parsed.research_publications !== undefined)
      payloadForUpdate.research_publications = parsed.research_publications;
    if (parsed.is_active !== undefined) payloadForUpdate.is_active = parsed.is_active;
    if (parsed.experience_years !== undefined) payloadForUpdate.experience_years = parsed.experience_years;

    return doctorService.update(doctorId, payloadForUpdate);
  },

  async delete(id: unknown) {
    const doctorId = doctorIdSchema.parse(id);
    return doctorService.remove(doctorId);
  },
};
