import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { revalidateSeoPaths } from "@/lib/seo";
import { CrudService } from "@/server/modules/common/crudService";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const doctorServiceInstance = new CrudService("doctors", "doctor");

type AdminDoctorLocale = "en" | "ar";
type DoctorTranslationStatus = "draft" | "published";

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type DoctorTranslationRow =
  Database["public"]["Tables"]["doctor_translations"]["Row"];
type DoctorInsert = Database["public"]["Tables"]["doctors"]["Insert"];
type DoctorUpdate = Database["public"]["Tables"]["doctors"]["Update"];
type DoctorTranslationUpsert =
  Database["public"]["Tables"]["doctor_translations"]["Insert"];

type ArabicDoctorResponse = DoctorRow & {
  translation: {
    exists: boolean;
    locale: "ar";
    status: DoctorTranslationStatus | null;
    is_stale: boolean;
    source_updated_at: string | null;
    updated_at: string | null;
    name: string | null;
    title: string | null;
    specialization: string | null;
    bio: string | null;
    education: string | null;
    languages: string[];
    achievements: string[];
    certifications: string[];
  };
};

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

const translationStatusSchema = z.enum(["draft", "published"]);

const arabicDoctorSchema = z.object({
  status: translationStatusSchema.default("draft"),
  name: z.string().optional(),
  title: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  languages: z.array(z.string().min(1)).default([]),
  achievements: z.array(z.string().min(1)).default([]),
  certifications: z.array(z.string().min(1)).default([]),
});

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

const sanitizeStringArray = (values: string[] | undefined | null) =>
  Array.isArray(values)
    ? values.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
    : [];

const buildSourceUpdatedAt = (doctor: DoctorRow) => doctor.updated_at;

const haveTranslatedDoctorFieldsChanged = (
  previousDoctor: DoctorRow,
  nextDoctor: DoctorRow,
) =>
  previousDoctor.name !== nextDoctor.name ||
  previousDoctor.title !== nextDoctor.title ||
  previousDoctor.specialization !== nextDoctor.specialization ||
  previousDoctor.bio !== nextDoctor.bio ||
  previousDoctor.education !== nextDoctor.education ||
  JSON.stringify(previousDoctor.languages ?? []) !==
    JSON.stringify(nextDoctor.languages ?? []) ||
  JSON.stringify(previousDoctor.achievements ?? []) !==
    JSON.stringify(nextDoctor.achievements ?? []) ||
  JSON.stringify(previousDoctor.certifications ?? []) !==
    JSON.stringify(nextDoctor.certifications ?? []);

const revalidateDoctorPages = (doctorId?: string | null) => {
  const paths = ["/doctors", "/ar/doctors"];

  if (doctorId) {
    paths.push(`/doctors/${doctorId}`, `/ar/doctors/${doctorId}`);
  }

  revalidateSeoPaths(paths);
};

const fetchDoctorTranslation = async (
  doctorId: string,
  locale: "ar",
): Promise<DoctorTranslationRow | null> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("doctor_translations")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load doctor translation", error.message);
  }

  return (data ?? null) as DoctorTranslationRow | null;
};

const buildArabicResponse = async (
  doctor: DoctorRow,
): Promise<ArabicDoctorResponse> => {
  const translation = await fetchDoctorTranslation(doctor.id, "ar");

  return {
    ...doctor,
    translation: {
      exists: Boolean(translation),
      locale: "ar",
      status:
        (translation?.status as DoctorTranslationStatus | undefined) ?? null,
      is_stale: translation?.is_stale ?? false,
      source_updated_at: translation?.source_updated_at ?? null,
      updated_at: translation?.updated_at ?? null,
      name: translation?.name ?? null,
      title: translation?.title ?? null,
      specialization: translation?.specialization ?? null,
      bio: translation?.bio ?? null,
      education: translation?.education ?? null,
      languages: sanitizeStringArray(translation?.languages),
      achievements: sanitizeStringArray(translation?.achievements),
      certifications: sanitizeStringArray(translation?.certifications),
    },
  };
};

const buildArabicPublishErrors = (
  doctor: DoctorRow,
  payload: z.infer<typeof arabicDoctorSchema>,
) => {
  const errors: string[] = [];

  const requireTranslatedField = (
    baseValue: string | string[] | null | undefined,
    translatedValue: string | string[] | null | undefined,
    label: string,
  ) => {
    const baseHasValue = Array.isArray(baseValue)
      ? sanitizeStringArray(baseValue).length > 0
      : trimOptionalString(baseValue ?? undefined) !== null;

    if (!baseHasValue) {
      return;
    }

    const translatedHasValue = Array.isArray(translatedValue)
      ? sanitizeStringArray(translatedValue).length > 0
      : trimOptionalString(translatedValue ?? undefined) !== null;

    if (!translatedHasValue) {
      errors.push(label);
    }
  };

  requireTranslatedField(doctor.name, payload.name, "Name");
  requireTranslatedField(doctor.title, payload.title, "Title");
  requireTranslatedField(
    doctor.specialization,
    payload.specialization,
    "Specialization",
  );
  requireTranslatedField(doctor.bio, payload.bio, "Biography");
  requireTranslatedField(doctor.education, payload.education, "Education");
  requireTranslatedField(doctor.languages, payload.languages, "Languages");
  requireTranslatedField(
    doctor.achievements,
    payload.achievements,
    "Achievements",
  );
  requireTranslatedField(
    doctor.certifications,
    payload.certifications,
    "Certifications",
  );

  return errors;
};

const upsertArabicTranslation = async (
  doctorId: string,
  payload: z.infer<typeof arabicDoctorSchema>,
) => {
  const doctor = (await doctorService.getById(doctorId)) as DoctorRow;

  if (payload.status === "published") {
    const errors = buildArabicPublishErrors(doctor, payload);
    if (errors.length > 0) {
      throw new ApiError(
        400,
        "Arabic publish validation failed",
        `Missing Arabic content for: ${errors.join(", ")}`,
      );
    }
  }

  const translationPayload: DoctorTranslationUpsert = {
    doctor_id: doctorId,
    locale: "ar",
    status: payload.status,
    is_stale: false,
    source_updated_at: buildSourceUpdatedAt(doctor),
    name: trimOptionalString(payload.name),
    title: trimOptionalString(payload.title),
    specialization: trimOptionalString(payload.specialization),
    bio: trimOptionalString(payload.bio),
    education: trimOptionalString(payload.education),
    languages: sanitizeStringArray(payload.languages),
    achievements: sanitizeStringArray(payload.achievements),
    certifications: sanitizeStringArray(payload.certifications),
  };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("doctor_translations")
    .upsert(translationPayload, {
      onConflict: "doctor_id,locale",
    });

  if (error) {
    throw new ApiError(
      500,
      "Failed to save Arabic doctor translation",
      error.message,
    );
  }
};

const deleteArabicTranslation = async (doctorId: string) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("doctor_translations")
    .delete()
    .eq("doctor_id", doctorId)
    .eq("locale", "ar");

  if (error) {
    throw new ApiError(
      500,
      "Failed to delete Arabic doctor translation",
      error.message,
    );
  }
};

const markDoctorTranslationsStale = async (
  doctorId: string,
  sourceUpdatedAt: string | null,
) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("doctor_translations")
    .update({
      is_stale: true,
      source_updated_at: sourceUpdatedAt,
    })
    .eq("doctor_id", doctorId)
    .eq("locale", "ar");

  if (error) {
    throw new ApiError(
      500,
      "Failed to mark Arabic doctor translations as stale",
      error.message,
    );
  }
};

export const doctorController = {
  async list(locale: AdminDoctorLocale = "en") {
    const rows = (await doctorService.list()) as DoctorRow[];

    if (locale === "en") {
      return rows;
    }

    return Promise.all(rows.map((doctor) => buildArabicResponse(doctor)));
  },

  async get(id: unknown, locale: AdminDoctorLocale = "en") {
    const doctorId = doctorIdSchema.parse(id);
    const doctor = (await doctorService.getById(doctorId)) as DoctorRow;

    if (locale === "ar") {
      return buildArabicResponse(doctor);
    }

    return doctor;
  },

  async create(payload: unknown, locale: AdminDoctorLocale = "en") {
    if (locale === "ar") {
      throw new ApiError(400, "Create the English doctor first");
    }

    const parsed = createDoctorSchema.parse(payload);

    const createPayload: DoctorInsert = {
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
        typeof parsed.avatar_url === "string" &&
        parsed.avatar_url.trim().length > 0
          ? parsed.avatar_url.trim()
          : null,
    };

    const doctor = (await doctorService.create(createPayload)) as DoctorRow;
    revalidateDoctorPages(doctor.id);
    return doctor;
  },

  async update(
    id: unknown,
    payload: unknown,
    locale: AdminDoctorLocale = "en",
  ) {
    const doctorId = doctorIdSchema.parse(id);

    if (locale === "ar") {
      const parsed = arabicDoctorSchema.parse(payload);
      await upsertArabicTranslation(doctorId, parsed);
      const doctor = (await doctorService.getById(doctorId)) as DoctorRow;
      revalidateDoctorPages(doctor.id);
      return buildArabicResponse(doctor);
    }

    const parsed = updateDoctorSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const existingDoctor = (await doctorService.getById(doctorId)) as DoctorRow;
    const payloadForUpdate: DoctorUpdate = {
      avatar_url:
        typeof parsed.avatar_url === "string"
          ? parsed.avatar_url.trim().length > 0
            ? parsed.avatar_url.trim()
            : null
          : parsed.avatar_url,
    };

    if (parsed.name !== undefined)
      payloadForUpdate.name = trimString(parsed.name);
    if (parsed.title !== undefined)
      payloadForUpdate.title = trimString(parsed.title);
    if (parsed.specialization !== undefined) {
      payloadForUpdate.specialization = trimString(parsed.specialization);
    }
    if (parsed.bio !== undefined)
      payloadForUpdate.bio = trimOptionalString(parsed.bio);
    if (parsed.education !== undefined) {
      payloadForUpdate.education = trimString(parsed.education);
    }
    if (parsed.languages !== undefined) {
      payloadForUpdate.languages = sanitizeStringArray(parsed.languages);
    }
    if (parsed.achievements !== undefined) {
      payloadForUpdate.achievements = sanitizeStringArray(parsed.achievements);
    }
    if (parsed.certifications !== undefined) {
      payloadForUpdate.certifications = sanitizeStringArray(
        parsed.certifications,
      );
    }
    if (parsed.patient_rating !== undefined) {
      payloadForUpdate.patient_rating = parsed.patient_rating;
    }
    if (parsed.total_reviews !== undefined) {
      payloadForUpdate.total_reviews = parsed.total_reviews;
    }
    if (parsed.successful_procedures !== undefined) {
      payloadForUpdate.successful_procedures = parsed.successful_procedures;
    }
    if (parsed.research_publications !== undefined) {
      payloadForUpdate.research_publications = parsed.research_publications;
    }
    if (parsed.is_active !== undefined)
      payloadForUpdate.is_active = parsed.is_active;
    if (parsed.experience_years !== undefined) {
      payloadForUpdate.experience_years = parsed.experience_years;
    }

    const updatedDoctor = (await doctorService.update(
      doctorId,
      payloadForUpdate,
    )) as DoctorRow;

    if (haveTranslatedDoctorFieldsChanged(existingDoctor, updatedDoctor)) {
      await markDoctorTranslationsStale(
        doctorId,
        buildSourceUpdatedAt(updatedDoctor),
      );
    }

    revalidateDoctorPages(updatedDoctor.id);
    return updatedDoctor;
  },

  async delete(id: unknown, locale: AdminDoctorLocale = "en") {
    const doctorId = doctorIdSchema.parse(id);

    if (locale === "ar") {
      await deleteArabicTranslation(doctorId);
      revalidateDoctorPages(doctorId);
      return { success: true };
    }

    const result = await doctorService.remove(doctorId);
    revalidateDoctorPages(doctorId);
    return result;
  },
};
