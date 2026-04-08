import type { PublicLocale } from "@/i18n/routing";
import type { Database } from "@/integrations/supabase/types";
import {
  buildDoctorDirectoryState,
  type DoctorDirectoryFilters,
  type DoctorDirectoryResponse,
  type LocalizedPublicDoctor,
} from "@/lib/doctors";
import { localizeCompanyName } from "@/lib/public/brand";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type DoctorTranslationRow =
  Database["public"]["Tables"]["doctor_translations"]["Row"];
type TreatmentTranslationRow =
  Database["public"]["Tables"]["treatment_translations"]["Row"];

type FetchLocalizedDoctorsInput = {
  locale: PublicLocale;
  treatmentCategory?: string;
  doctorIds?: string[];
  featuredOnly?: boolean;
  specializations?: string[];
  limit?: number;
};

export type LocalizedDoctorReview = {
  id: string;
  patient_name: string;
  patient_country: string | null;
  treatment_id: string;
  treatment_slug: string | null;
  treatment_name: string | null;
  procedure_name: string | null;
  rating: number;
  review_text: string;
  recovery_time: string | null;
  is_verified: boolean;
  created_at: string;
};

const trimNullableString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const ARABIC_DOCTOR_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bDr\.\s*/g, "د. "],
  [/\bUCLA\b/g, "جامعة كاليفورنيا في لوس أنجلوس"],
  [/\bHSS\b/g, "مستشفى الجراحة الخاصة"],
  [/\bAll-on-4\b/gi, "آل-أون-4"],
  [/\bHarvard\b/g, "هارفارد"],
  [/\bJohns Hopkins\b/g, "جونز هوبكنز"],
  [/\bBeverly Hills\b/g, "بيفرلي هيلز"],
  [/\bMayo Clinic\b/g, "مايو كلينك"],
];

const localizeArabicDoctorText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return value;
  }

  let localized = localizeCompanyName(value, "ar");

  for (const [pattern, replacement] of ARABIC_DOCTOR_TEXT_REPLACEMENTS) {
    localized = localized.replace(pattern, replacement);
  }

  return localized;
};

const localizeArabicDoctorTextArray = (value: unknown) =>
  sanitizeStringArray(value)
    .map((entry) => localizeArabicDoctorText(entry))
    .filter((entry): entry is string => Boolean(entry?.trim()));

const resolveArabicDoctorTextArray = (
  translatedValue: unknown,
  fallbackValue: unknown,
) => {
  const translatedEntries = localizeArabicDoctorTextArray(translatedValue);
  return translatedEntries.length > 0
    ? translatedEntries
    : localizeArabicDoctorTextArray(fallbackValue);
};

const sortDoctors = (doctors: DoctorRow[]) =>
  doctors.sort((first, second) => {
    const firstRating =
      typeof first.patient_rating === "number" ? first.patient_rating : -1;
    const secondRating =
      typeof second.patient_rating === "number" ? second.patient_rating : -1;

    if (firstRating !== secondRating) {
      return secondRating - firstRating;
    }

    const firstProcedures =
      typeof first.successful_procedures === "number"
        ? first.successful_procedures
        : -1;
    const secondProcedures =
      typeof second.successful_procedures === "number"
        ? second.successful_procedures
        : -1;

    if (firstProcedures !== secondProcedures) {
      return secondProcedures - firstProcedures;
    }

    return first.name.localeCompare(second.name);
  });

const applyDoctorTranslation = (
  doctor: DoctorRow,
  translation: DoctorTranslationRow,
): LocalizedPublicDoctor => {
  return {
    ...doctor,
    name:
      localizeArabicDoctorText(trimNullableString(translation.name)) ??
      localizeArabicDoctorText(doctor.name),
    title:
      localizeArabicDoctorText(trimNullableString(translation.title)) ??
      localizeArabicDoctorText(doctor.title),
    specialization:
      localizeArabicDoctorText(
        trimNullableString(translation.specialization),
      ) ?? localizeArabicDoctorText(doctor.specialization),
    bio:
      localizeArabicDoctorText(trimNullableString(translation.bio)) ??
      localizeArabicDoctorText(doctor.bio),
    education:
      localizeArabicDoctorText(trimNullableString(translation.education)) ??
      localizeArabicDoctorText(doctor.education),
    languages: resolveArabicDoctorTextArray(
      translation.languages,
      doctor.languages,
    ),
    achievements: resolveArabicDoctorTextArray(
      translation.achievements,
      doctor.achievements,
    ),
    certifications: resolveArabicDoctorTextArray(
      translation.certifications,
      doctor.certifications,
    ),
    updated_at:
      translation.updated_at > doctor.updated_at
        ? translation.updated_at
        : doctor.updated_at,
  };
};

async function getPublishedDoctorTranslations(doctorIds: string[]) {
  if (doctorIds.length === 0) {
    return [] as DoctorTranslationRow[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("doctor_translations")
    .select("*")
    .eq("locale", "ar")
    .eq("status", "published")
    .in("doctor_id", doctorIds);

  if (error) {
    console.error("Failed to load doctor translations", error);
    return [];
  }

  return (data ?? []) as DoctorTranslationRow[];
}

async function getPublishedTreatmentTranslations(treatmentIds: string[]) {
  if (treatmentIds.length === 0) {
    return [] as TreatmentTranslationRow[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_translations")
    .select("treatment_id, name")
    .eq("locale", "ar")
    .eq("status", "published")
    .in("treatment_id", treatmentIds);

  if (error) {
    console.error("Failed to load treatment translations for doctor reviews", {
      treatmentIds,
      error,
    });
    return [];
  }

  return (data ?? []) as TreatmentTranslationRow[];
}

async function fetchDoctorRows(
  input: FetchLocalizedDoctorsInput,
): Promise<DoctorRow[]> {
  const supabase = getSupabaseAdmin();
  const doctorIds = (input.doctorIds ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);
  const specializations = (input.specializations ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);
  const limit =
    typeof input.limit === "number" && input.limit > 0 ? input.limit : null;

  let query = supabase.from("doctors").select("*").eq("is_active", true);

  if (input.treatmentCategory) {
    query = supabase
      .from("doctors")
      .select(
        `
        *,
        doctor_treatments!inner(treatment_category)
      `,
      )
      .eq("is_active", true)
      .eq("doctor_treatments.treatment_category", input.treatmentCategory);
  }

  if (doctorIds.length > 0) {
    query = query.in("id", doctorIds);
  }

  if (input.featuredOnly) {
    query = query.gte("patient_rating", 4.5);
  }

  if (specializations.length > 0) {
    query = query.in("specialization", specializations);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = sortDoctors((data ?? []) as DoctorRow[]);

  if (doctorIds.length > 0) {
    const orderMap = new Map(
      doctorIds.map((doctorId, index) => [doctorId, index] as const),
    );

    rows.sort((first, second) => {
      const firstRank = orderMap.get(first.id) ?? Number.MAX_SAFE_INTEGER;
      const secondRank = orderMap.get(second.id) ?? Number.MAX_SAFE_INTEGER;
      return firstRank - secondRank;
    });
  }

  return limit ? rows.slice(0, limit) : rows;
}

export async function fetchLocalizedPublicDoctors(
  input: FetchLocalizedDoctorsInput,
): Promise<LocalizedPublicDoctor[]> {
  const rows = await fetchDoctorRows(input);

  if (input.locale === "en") {
    return rows;
  }

  const translations = await getPublishedDoctorTranslations(
    rows.map((row) => row.id),
  );
  const translationsByDoctorId = new Map(
    translations.map((translation) => [translation.doctor_id, translation]),
  );

  return rows
    .filter((row) => translationsByDoctorId.has(row.id))
    .map((row) =>
      applyDoctorTranslation(row, translationsByDoctorId.get(row.id)!),
    );
}

export async function fetchPublicDoctorDirectory(
  filters: DoctorDirectoryFilters = {},
  locale: PublicLocale = "en",
): Promise<DoctorDirectoryResponse<LocalizedPublicDoctor>> {
  const doctors = await fetchLocalizedPublicDoctors({ locale });
  return buildDoctorDirectoryState({ doctors, filters });
}

export async function fetchLocalizedPublicDoctorById(
  locale: PublicLocale,
  doctorId: string,
): Promise<LocalizedPublicDoctor | null> {
  const doctors = await fetchLocalizedPublicDoctors({
    locale,
    doctorIds: [doctorId],
    limit: 1,
  });

  return doctors[0] ?? null;
}

export async function hasPublishedArabicDoctorTranslation(doctorId: string) {
  return (await fetchLocalizedPublicDoctorById("ar", doctorId)) !== null;
}

export async function fetchLocalizedDoctorReviews(
  doctorId: string,
  locale: PublicLocale,
): Promise<LocalizedDoctorReview[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("doctor_reviews")
    .select(
      "id, patient_name, patient_country, treatment_id, procedure_name, rating, review_text, recovery_time, is_verified, created_at, treatments(id, slug, name)",
    )
    .eq("published", true)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load localized doctor reviews", {
      doctorId,
      error,
    });
    return [];
  }

  const reviews = (data ?? []) as Array<{
    id: string;
    patient_name: string;
    patient_country: string | null;
    treatment_id: string;
    procedure_name: string | null;
    rating: number;
    review_text: string;
    recovery_time: string | null;
    is_verified: boolean;
    created_at: string;
    treatments?: {
      id?: string | null;
      slug?: string | null;
      name?: string | null;
    } | null;
  }>;

  if (locale === "en") {
    return reviews.map((review) => ({
      id: review.id,
      patient_name: review.patient_name,
      patient_country: review.patient_country,
      treatment_id: review.treatment_id,
      treatment_slug: review.treatments?.slug ?? null,
      treatment_name: review.treatments?.name ?? null,
      procedure_name: review.procedure_name,
      rating: review.rating,
      review_text: review.review_text,
      recovery_time: review.recovery_time,
      is_verified: review.is_verified,
      created_at: review.created_at,
    }));
  }

  const translations = await getPublishedTreatmentTranslations(
    reviews.map((review) => review.treatment_id),
  );
  const translationsByTreatmentId = new Map(
    translations.map((translation) => [
      translation.treatment_id,
      trimNullableString(translation.name),
    ]),
  );

  return reviews.map((review) => ({
    id: review.id,
    patient_name: review.patient_name,
    patient_country: review.patient_country,
    treatment_id: review.treatment_id,
    treatment_slug: review.treatments?.slug ?? null,
    treatment_name:
      translationsByTreatmentId.get(review.treatment_id) ??
      review.treatments?.name ??
      null,
    procedure_name: review.procedure_name,
    rating: review.rating,
    review_text: review.review_text,
    recovery_time: review.recovery_time,
    is_verified: review.is_verified,
    created_at: review.created_at,
  }));
}
