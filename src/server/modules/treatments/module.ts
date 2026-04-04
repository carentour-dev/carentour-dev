import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { revalidateSeoPaths } from "@/lib/seo";
import { recordPathRedirect } from "@/lib/seo/redirects";
import { CrudService } from "@/server/modules/common/crudService";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const treatmentsService = new CrudService("treatments", "treatment");

type AdminTreatmentLocale = "en" | "ar";
type TreatmentTranslationStatus = "draft" | "published";

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentProcedureRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];
type TreatmentTranslationRow =
  Database["public"]["Tables"]["treatment_translations"]["Row"];
type TreatmentProcedureTranslationRow =
  Database["public"]["Tables"]["treatment_procedure_translations"]["Row"];

type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"] & {
  download_url?: string | null;
};
type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"] & {
  download_url?: string | null;
};
type TreatmentProcedureInsert =
  Database["public"]["Tables"]["treatment_procedures"]["Insert"] & {
    pdf_url?: string | null;
    additional_notes?: string | null;
    is_public?: boolean;
    created_by_provider_id?: string | null;
  };
type TreatmentProcedureUpdate =
  Database["public"]["Tables"]["treatment_procedures"]["Update"] & {
    pdf_url?: string | null;
    additional_notes?: string | null;
    is_public?: boolean;
    created_by_provider_id?: string | null;
  };
type TreatmentTranslationUpsert =
  Database["public"]["Tables"]["treatment_translations"]["Insert"];
type TreatmentProcedureTranslationUpsert =
  Database["public"]["Tables"]["treatment_procedure_translations"]["Insert"];

type TreatmentWithProcedures = TreatmentRow & {
  procedures: TreatmentProcedureRow[];
};

type TreatmentPublicSnapshot = {
  name: string;
  category: string | null;
  summary: string | null;
  description: string | null;
  overview: string | null;
  ideal_candidates: string[];
};

type ProcedurePublicSnapshot = {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  recovery: string | null;
  price: string | null;
  success_rate: string | null;
  candidate_requirements: string[];
  recovery_stages: Array<{ stage: string; description: string }>;
  additional_notes: string | null;
};

type ArabicTreatmentResponse = TreatmentRow & {
  download_url?: string | null;
  grade: Database["public"]["Enums"]["treatment_grade"];
  procedures: TreatmentProcedureRow[];
  translation: {
    exists: boolean;
    locale: "ar";
    status: TreatmentTranslationStatus | null;
    is_stale: boolean;
    source_updated_at: string | null;
    updated_at: string | null;
    name: string | null;
    category_label: string | null;
    summary: string | null;
    description: string | null;
    overview: string | null;
    ideal_candidates: string[];
    seo: Json | null;
  };
  procedure_translations: TreatmentProcedureTranslationRow[];
};

const METADATA_TABLE = "treatment_metadata";
const DEFAULT_GRADE: Database["public"]["Enums"]["treatment_grade"] = "grade_c";

const gradeSchema = z.enum(["grade_a", "grade_b", "grade_c"]);
const translationStatusSchema = z.enum(["draft", "published"]);

const internationalPriceSchema = z.object({
  country: z.string().min(1),
  currency: z.string().min(1),
  price: z.coerce.number().min(0),
  flag: z.string().min(1).optional(),
});

const recoveryStageSchema = z.object({
  stage: z.string().min(1),
  description: z.string().min(1),
});

const procedureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  duration: z.string().optional(),
  recovery: z.string().optional(),
  price: z.string().optional(),
  egyptPrice: z.coerce.number().min(0).optional(),
  successRate: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  createdByProviderId: z.string().uuid().nullable().optional(),
  candidateRequirements: z.array(z.string().min(1)).default([]),
  recoveryStages: z.array(recoveryStageSchema).default([]),
  internationalPrices: z.array(internationalPriceSchema).default([]),
  pdfUrl: z.string().nullable().optional(),
  additionalNotes: z.string().optional(),
});

const baseTreatmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().min(1, "Specialty is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  overview: z.string().optional(),
  download_url: z.string().nullable().optional(),
  ideal_candidates: z.array(z.string().min(1)).default([]),
  card_image_url: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  recovery_time_days: z.coerce.number().int().min(0).optional(),
  success_rate: z.coerce.number().min(0).max(100).optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_listed_public: z.boolean().optional(),
  grade: gradeSchema.default("grade_c"),
});

const createTreatmentSchema = baseTreatmentSchema.extend({
  procedures: z.array(procedureSchema).nonempty("Add at least one procedure"),
});

const updateTreatmentSchema = baseTreatmentSchema.partial().extend({
  procedures: z.array(procedureSchema).optional(),
});

const arabicProcedureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  recovery: z.string().optional(),
  price: z.string().optional(),
  successRate: z.string().optional(),
  candidateRequirements: z.array(z.string().min(1)).default([]),
  recoveryStages: z.array(recoveryStageSchema).default([]),
  additionalNotes: z.string().optional(),
});

const arabicTreatmentSchema = z.object({
  status: translationStatusSchema.default("draft"),
  name: z.string().optional(),
  category_label: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  overview: z.string().optional(),
  ideal_candidates: z.array(z.string().min(1)).default([]),
  seo: z.record(z.string(), z.unknown()).optional(),
  procedures: z.array(arabicProcedureSchema).default([]),
});

const treatmentIdSchema = z.string().uuid();

const providerProcedureSchema = z.object({
  treatmentId: z.string().uuid(),
  procedure: procedureSchema.omit({ id: true }),
});

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

const sanitizeRecoveryStages = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as Array<{ stage: string; description: string }>;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const stage = trimNullableString(
        (entry as Record<string, unknown>).stage,
      );
      const description = trimNullableString(
        (entry as Record<string, unknown>).description,
      );

      if (!stage || !description) {
        return null;
      }

      return { stage, description };
    })
    .filter(
      (
        entry,
      ): entry is {
        stage: string;
        description: string;
      } => Boolean(entry),
    );
};

const jsonEqual = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);

const isVisiblePublicProcedure = (procedure: TreatmentProcedureRow) =>
  procedure.created_by_provider_id == null && procedure.is_public !== false;

const getSourceUpdatedAt = (treatment: TreatmentWithProcedures) => {
  const timestamps = [
    treatment.updated_at,
    ...treatment.procedures
      .filter(isVisiblePublicProcedure)
      .map((procedure) => procedure.updated_at),
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

const buildTreatmentPublicSnapshot = (
  treatment: TreatmentRow,
): TreatmentPublicSnapshot => ({
  name: treatment.name.trim(),
  category: trimNullableString(treatment.category),
  summary: trimNullableString(treatment.summary),
  description: trimNullableString(treatment.description),
  overview: trimNullableString(treatment.overview),
  ideal_candidates: sanitizeStringArray(treatment.ideal_candidates ?? []),
});

const buildProcedurePublicSnapshot = (
  procedure: TreatmentProcedureRow,
): ProcedurePublicSnapshot | null => {
  if (!isVisiblePublicProcedure(procedure)) {
    return null;
  }

  return {
    id: procedure.id,
    name: procedure.name.trim(),
    description: trimNullableString(procedure.description),
    duration: trimNullableString(procedure.duration),
    recovery: trimNullableString(procedure.recovery),
    price: trimNullableString(procedure.price),
    success_rate: trimNullableString(procedure.success_rate),
    candidate_requirements: sanitizeStringArray(
      procedure.candidate_requirements ?? [],
    ),
    recovery_stages: sanitizeRecoveryStages(procedure.recovery_stages),
    additional_notes: trimNullableString(procedure.additional_notes),
  };
};

const havePublicTreatmentFieldsChanged = (
  first: TreatmentWithProcedures,
  second: TreatmentWithProcedures,
) =>
  !jsonEqual(
    buildTreatmentPublicSnapshot(first),
    buildTreatmentPublicSnapshot(second),
  );

const havePublicProcedureFieldsChanged = (
  first: TreatmentProcedureRow[],
  second: TreatmentProcedureRow[],
) => {
  const firstVisible = new Map(
    first
      .map((procedure) => buildProcedurePublicSnapshot(procedure))
      .filter((procedure): procedure is ProcedurePublicSnapshot =>
        Boolean(procedure),
      )
      .map((procedure) => [procedure.id, procedure]),
  );
  const secondVisible = new Map(
    second
      .map((procedure) => buildProcedurePublicSnapshot(procedure))
      .filter((procedure): procedure is ProcedurePublicSnapshot =>
        Boolean(procedure),
      )
      .map((procedure) => [procedure.id, procedure]),
  );

  if (firstVisible.size !== secondVisible.size) {
    return true;
  }

  for (const [id, snapshot] of firstVisible) {
    if (!jsonEqual(snapshot, secondVisible.get(id) ?? null)) {
      return true;
    }
  }

  return false;
};

const normalizeUploadValue = (value: string | null | undefined) =>
  value === null ? null : trimNullableString(value);

const buildProcedurePayload = (
  treatmentId: string,
  procedure: z.infer<typeof procedureSchema>,
  displayOrder: number,
): TreatmentProcedureInsert => {
  const createdByProviderId =
    typeof procedure.createdByProviderId === "string" &&
    procedure.createdByProviderId.trim().length > 0
      ? procedure.createdByProviderId.trim()
      : null;

  return {
    ...(procedure.id ? { id: procedure.id } : {}),
    treatment_id: treatmentId,
    name: procedure.name.trim(),
    description: trimNullableString(procedure.description),
    duration: trimNullableString(procedure.duration),
    recovery: trimNullableString(procedure.recovery),
    price: trimNullableString(procedure.price),
    egypt_price:
      typeof procedure.egyptPrice === "number" &&
      !Number.isNaN(procedure.egyptPrice)
        ? procedure.egyptPrice
        : null,
    success_rate: trimNullableString(procedure.successRate),
    candidate_requirements: sanitizeStringArray(
      procedure.candidateRequirements ?? [],
    ),
    recovery_stages: (procedure.recoveryStages ?? []).map((stage) => ({
      stage: stage.stage.trim(),
      description: stage.description.trim(),
    })),
    international_prices: (procedure.internationalPrices ?? [])
      .map((price) => ({
        country: price.country.trim(),
        currency: price.currency.trim(),
        price: price.price,
        ...(trimNullableString(price.flag) ? { flag: price.flag.trim() } : {}),
      }))
      .filter(
        (price) =>
          price.country.length > 0 &&
          price.currency.length > 0 &&
          typeof price.price === "number" &&
          !Number.isNaN(price.price),
      ),
    display_order:
      typeof procedure.displayOrder === "number"
        ? procedure.displayOrder
        : displayOrder,
    pdf_url: normalizeUploadValue(procedure.pdfUrl),
    additional_notes: trimNullableString(procedure.additionalNotes),
    is_public: procedure.isPublic ?? true,
    created_by_provider_id: createdByProviderId,
  };
};

const buildProcedureUpdatePayload = (
  treatmentId: string,
  procedure: z.infer<typeof procedureSchema>,
  displayOrder: number,
): TreatmentProcedureUpdate => {
  const payload = buildProcedurePayload(treatmentId, procedure, displayOrder);
  return {
    treatment_id: payload.treatment_id,
    name: payload.name,
    description: payload.description,
    duration: payload.duration,
    recovery: payload.recovery,
    price: payload.price,
    egypt_price: payload.egypt_price,
    success_rate: payload.success_rate,
    candidate_requirements: payload.candidate_requirements,
    recovery_stages: payload.recovery_stages,
    international_prices: payload.international_prices,
    display_order: payload.display_order,
    pdf_url: payload.pdf_url,
    additional_notes: payload.additional_notes,
    is_public: payload.is_public,
    created_by_provider_id: payload.created_by_provider_id,
  };
};

const upsertTreatmentGrade = async (
  treatmentId: string,
  grade: Database["public"]["Enums"]["treatment_grade"],
) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(METADATA_TABLE)
    .upsert({ treatment_id: treatmentId, grade })
    .select("grade")
    .single();

  if (error) {
    throw new ApiError(500, "Failed to update treatment grade", error.message);
  }

  return (data?.grade ??
    grade) as Database["public"]["Enums"]["treatment_grade"];
};

const fetchTreatmentGrade = async (
  treatmentId: string,
): Promise<Database["public"]["Enums"]["treatment_grade"]> => {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from(METADATA_TABLE)
      .select("grade")
      .eq("treatment_id", treatmentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.grade ??
      DEFAULT_GRADE) as Database["public"]["Enums"]["treatment_grade"];
  } catch (error) {
    console.error("Failed to load treatment metadata", error);
    return DEFAULT_GRADE;
  }
};

const fetchTreatmentMetadataMap = async () => {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from(METADATA_TABLE)
      .select("treatment_id, grade");

    if (error) {
      throw error;
    }

    const map = new Map<
      string,
      Database["public"]["Enums"]["treatment_grade"]
    >();

    for (const row of data ?? []) {
      map.set(
        row.treatment_id,
        row.grade as Database["public"]["Enums"]["treatment_grade"],
      );
    }

    return map;
  } catch (error) {
    console.error("Failed to load treatment metadata", error);
    return new Map<string, Database["public"]["Enums"]["treatment_grade"]>();
  }
};

const fetchTreatmentWithProcedures = async (
  treatmentId: string,
): Promise<TreatmentWithProcedures> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select("*, procedures:treatment_procedures(*)")
    .eq("id", treatmentId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load treatment", error.message);
  }

  if (!data) {
    throw new ApiError(404, "Treatment not found");
  }

  return data as TreatmentWithProcedures;
};

const fetchTreatmentTranslation = async (
  treatmentId: string,
  locale: "ar",
): Promise<TreatmentTranslationRow | null> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_translations")
    .select("*")
    .eq("treatment_id", treatmentId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "Failed to load treatment translation",
      error.message,
    );
  }

  return (data ?? null) as TreatmentTranslationRow | null;
};

const fetchProcedureTranslations = async (
  procedureIds: string[],
  locale: "ar",
) => {
  if (procedureIds.length === 0) {
    return [] as TreatmentProcedureTranslationRow[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_procedure_translations")
    .select("*")
    .eq("locale", locale)
    .in("treatment_procedure_id", procedureIds);

  if (error) {
    throw new ApiError(
      500,
      "Failed to load procedure translations",
      error.message,
    );
  }

  return (data ?? []) as TreatmentProcedureTranslationRow[];
};

const buildArabicResponse = async (
  treatment: TreatmentWithProcedures,
): Promise<ArabicTreatmentResponse> => {
  const grade = await fetchTreatmentGrade(treatment.id);
  const translation = await fetchTreatmentTranslation(treatment.id, "ar");
  const procedureTranslations = await fetchProcedureTranslations(
    treatment.procedures.map((procedure) => procedure.id),
    "ar",
  );

  return {
    ...treatment,
    grade,
    translation: {
      exists: Boolean(translation),
      locale: "ar",
      status:
        (translation?.status as TreatmentTranslationStatus | undefined) ?? null,
      is_stale: translation?.is_stale ?? false,
      source_updated_at: translation?.source_updated_at ?? null,
      updated_at: translation?.updated_at ?? null,
      name: translation?.name ?? null,
      category_label: translation?.category_label ?? null,
      summary: translation?.summary ?? null,
      description: translation?.description ?? null,
      overview: translation?.overview ?? null,
      ideal_candidates: sanitizeStringArray(
        translation?.ideal_candidates ?? [],
      ),
      seo: translation?.seo ?? null,
    },
    procedure_translations: procedureTranslations,
  };
};

const revalidateTreatmentPages = (
  slug: string | null,
  previousSlug?: string | null,
) => {
  const paths = ["/treatments", "/ar/treatments"];

  const normalizedSlug = trimNullableString(slug);
  if (normalizedSlug) {
    paths.push(
      `/treatments/${normalizedSlug}`,
      `/ar/treatments/${normalizedSlug}`,
    );
  }

  const normalizedPreviousSlug = trimNullableString(previousSlug);
  if (normalizedPreviousSlug && normalizedPreviousSlug !== normalizedSlug) {
    paths.push(
      `/treatments/${normalizedPreviousSlug}`,
      `/ar/treatments/${normalizedPreviousSlug}`,
    );
  }

  revalidateSeoPaths(paths);
};

const markTreatmentTranslationsStale = async (
  treatmentId: string,
  sourceUpdatedAt: string | null,
) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("treatment_translations")
    .update({
      is_stale: true,
      source_updated_at: sourceUpdatedAt,
    })
    .eq("treatment_id", treatmentId)
    .eq("locale", "ar");

  if (error) {
    throw new ApiError(
      500,
      "Failed to mark Arabic treatment translations as stale",
      error.message,
    );
  }
};

const upsertProcedures = async (
  treatmentId: string,
  procedures: z.infer<typeof procedureSchema>[],
) => {
  if (procedures.length === 0) {
    throw new ApiError(400, "Treatments must include at least one procedure");
  }

  const supabase = getSupabaseAdmin();
  const { data: existingRows, error: existingError } = await supabase
    .from("treatment_procedures")
    .select("*")
    .eq("treatment_id", treatmentId);

  if (existingError) {
    throw new ApiError(
      500,
      "Failed to load existing treatment procedures",
      existingError.message,
    );
  }

  const existingById = new Map(
    ((existingRows ?? []) as TreatmentProcedureRow[]).map((procedure) => [
      procedure.id,
      procedure,
    ]),
  );
  const retainedIds = new Set<string>();

  for (const [index, procedure] of procedures.entries()) {
    if (procedure.id && existingById.has(procedure.id)) {
      const { error } = await supabase
        .from("treatment_procedures")
        .update(buildProcedureUpdatePayload(treatmentId, procedure, index))
        .eq("id", procedure.id);

      if (error) {
        throw new ApiError(
          500,
          "Failed to update treatment procedure",
          error.message,
        );
      }

      retainedIds.add(procedure.id);
      continue;
    }

    const { data, error } = await supabase
      .from("treatment_procedures")
      .insert([buildProcedurePayload(treatmentId, procedure, index)])
      .select("id")
      .single();

    if (error) {
      throw new ApiError(
        500,
        "Failed to create treatment procedure",
        error.message,
      );
    }

    if (data?.id) {
      retainedIds.add(data.id);
    }
  }

  const removableIds = (existingRows ?? [])
    .map((procedure) => procedure.id)
    .filter((id) => !retainedIds.has(id));

  if (removableIds.length > 0) {
    const { error } = await supabase
      .from("treatment_procedures")
      .delete()
      .in("id", removableIds);

    if (error) {
      throw new ApiError(
        500,
        "Failed to remove deleted treatment procedures",
        error.message,
      );
    }
  }
};

const buildArabicPublishErrors = (
  treatment: TreatmentWithProcedures,
  payload: z.infer<typeof arabicTreatmentSchema>,
) => {
  const errors: string[] = [];

  const requireTranslatedField = (
    baseValue: unknown,
    translatedValue: unknown,
    label: string,
  ) => {
    const baseHasValue = Array.isArray(baseValue)
      ? sanitizeStringArray(baseValue).length > 0
      : trimNullableString(baseValue) !== null;

    if (!baseHasValue) {
      return;
    }

    const translatedHasValue = Array.isArray(translatedValue)
      ? sanitizeStringArray(translatedValue).length > 0
      : trimNullableString(translatedValue) !== null;

    if (!translatedHasValue) {
      errors.push(label);
    }
  };

  requireTranslatedField(treatment.name, payload.name, "Treatment name");
  requireTranslatedField(
    treatment.category,
    payload.category_label,
    "Category label",
  );
  requireTranslatedField(treatment.summary, payload.summary, "Summary");
  requireTranslatedField(
    treatment.description,
    payload.description,
    "Description",
  );
  requireTranslatedField(treatment.overview, payload.overview, "Overview");
  requireTranslatedField(
    treatment.ideal_candidates,
    payload.ideal_candidates,
    "Ideal candidates",
  );

  const visibleProcedures = treatment.procedures.filter(
    isVisiblePublicProcedure,
  );
  const payloadProceduresById = new Map(
    payload.procedures.map((procedure) => [procedure.id, procedure]),
  );

  for (const procedure of visibleProcedures) {
    const translation = payloadProceduresById.get(procedure.id);
    const procedureLabel = procedure.name.trim();

    requireTranslatedField(
      procedure.name,
      translation?.name,
      `${procedureLabel}: name`,
    );
    requireTranslatedField(
      procedure.description,
      translation?.description,
      `${procedureLabel}: description`,
    );
    requireTranslatedField(
      procedure.duration,
      translation?.duration,
      `${procedureLabel}: duration`,
    );
    requireTranslatedField(
      procedure.recovery,
      translation?.recovery,
      `${procedureLabel}: recovery`,
    );
    requireTranslatedField(
      procedure.price,
      translation?.price,
      `${procedureLabel}: price`,
    );
    requireTranslatedField(
      procedure.success_rate,
      translation?.successRate,
      `${procedureLabel}: success rate`,
    );
    requireTranslatedField(
      procedure.candidate_requirements,
      translation?.candidateRequirements,
      `${procedureLabel}: candidate requirements`,
    );
    requireTranslatedField(
      procedure.recovery_stages,
      translation?.recoveryStages,
      `${procedureLabel}: recovery stages`,
    );
    requireTranslatedField(
      procedure.additional_notes,
      translation?.additionalNotes,
      `${procedureLabel}: additional notes`,
    );
  }

  return errors;
};

const upsertArabicTranslations = async (
  treatmentId: string,
  payload: z.infer<typeof arabicTreatmentSchema>,
) => {
  const treatment = await fetchTreatmentWithProcedures(treatmentId);

  if (payload.status === "published") {
    const errors = buildArabicPublishErrors(treatment, payload);
    if (errors.length > 0) {
      throw new ApiError(
        400,
        "Arabic publish validation failed",
        `Missing Arabic content for: ${errors.join(", ")}`,
      );
    }
  }

  const visibleProcedureIds = new Set(
    treatment.procedures
      .filter(isVisiblePublicProcedure)
      .map((procedure) => procedure.id),
  );

  for (const procedure of payload.procedures) {
    if (!visibleProcedureIds.has(procedure.id)) {
      throw new ApiError(
        400,
        "Arabic translations can only target existing public treatment procedures",
      );
    }
  }

  const existingTranslation = await fetchTreatmentTranslation(
    treatmentId,
    "ar",
  );
  const sourceUpdatedAt = getSourceUpdatedAt(treatment);
  const treatmentTranslationPayload: TreatmentTranslationUpsert = {
    treatment_id: treatmentId,
    locale: "ar",
    status: payload.status,
    is_stale: false,
    source_updated_at: sourceUpdatedAt,
    name: trimNullableString(payload.name),
    category_label: trimNullableString(payload.category_label),
    summary: trimNullableString(payload.summary),
    description: trimNullableString(payload.description),
    overview: trimNullableString(payload.overview),
    ideal_candidates: sanitizeStringArray(payload.ideal_candidates ?? []),
    seo:
      payload.seo && Object.keys(payload.seo).length > 0
        ? (payload.seo as Json)
        : (existingTranslation?.seo ?? {}),
  };

  const supabase = getSupabaseAdmin();
  const { error: translationError } = await supabase
    .from("treatment_translations")
    .upsert(treatmentTranslationPayload, {
      onConflict: "treatment_id,locale",
    });

  if (translationError) {
    throw new ApiError(
      500,
      "Failed to save Arabic treatment translation",
      translationError.message,
    );
  }

  for (const procedure of payload.procedures) {
    const procedureTranslationPayload: TreatmentProcedureTranslationUpsert = {
      treatment_procedure_id: procedure.id,
      locale: "ar",
      name: trimNullableString(procedure.name),
      description: trimNullableString(procedure.description),
      duration: trimNullableString(procedure.duration),
      recovery: trimNullableString(procedure.recovery),
      price: trimNullableString(procedure.price),
      success_rate: trimNullableString(procedure.successRate),
      candidate_requirements: sanitizeStringArray(
        procedure.candidateRequirements ?? [],
      ),
      recovery_stages: (procedure.recoveryStages ?? []).map((stage) => ({
        stage: stage.stage.trim(),
        description: stage.description.trim(),
      })),
      additional_notes: trimNullableString(procedure.additionalNotes),
    };

    const { error } = await supabase
      .from("treatment_procedure_translations")
      .upsert(procedureTranslationPayload, {
        onConflict: "treatment_procedure_id,locale",
      });

    if (error) {
      throw new ApiError(
        500,
        "Failed to save Arabic procedure translation",
        error.message,
      );
    }
  }
};

const deleteArabicTranslations = async (treatmentId: string) => {
  const treatment = await fetchTreatmentWithProcedures(treatmentId);
  const procedureIds = treatment.procedures.map((procedure) => procedure.id);
  const supabase = getSupabaseAdmin();

  if (procedureIds.length > 0) {
    const { error } = await supabase
      .from("treatment_procedure_translations")
      .delete()
      .eq("locale", "ar")
      .in("treatment_procedure_id", procedureIds);

    if (error) {
      throw new ApiError(
        500,
        "Failed to delete Arabic procedure translations",
        error.message,
      );
    }
  }

  const { error } = await supabase
    .from("treatment_translations")
    .delete()
    .eq("treatment_id", treatmentId)
    .eq("locale", "ar");

  if (error) {
    throw new ApiError(
      500,
      "Failed to delete Arabic treatment translation",
      error.message,
    );
  }
};

export const treatmentController = {
  async list(locale: AdminTreatmentLocale = "en") {
    const rows =
      (await treatmentsService.list()) as Database["public"]["Tables"]["treatments"]["Row"][];
    const metadata = await fetchTreatmentMetadataMap();

    const supabase = getSupabaseAdmin();
    const { data: proceduresData, error: proceduresError } = await supabase
      .from("treatment_procedures")
      .select("*");

    if (proceduresError) {
      throw new ApiError(
        500,
        "Failed to load treatment procedures",
        proceduresError.message,
      );
    }

    const procedureGroups = new Map<string, TreatmentProcedureRow[]>();
    for (const procedure of (proceduresData ?? []) as TreatmentProcedureRow[]) {
      if (!procedureGroups.has(procedure.treatment_id)) {
        procedureGroups.set(procedure.treatment_id, []);
      }
      procedureGroups.get(procedure.treatment_id)?.push(procedure);
    }

    if (locale === "en") {
      return rows.map((row) => ({
        ...row,
        grade: metadata.get(row.id) ?? DEFAULT_GRADE,
        procedures: (procedureGroups.get(row.id) ?? []).sort(
          (first, second) =>
            (first.display_order ?? 0) - (second.display_order ?? 0),
        ),
      }));
    }

    const translations = await Promise.all(
      rows.map((row) => fetchTreatmentTranslation(row.id, "ar")),
    );
    const procedureIds = Array.from(
      new Set(
        rows.flatMap((row) =>
          (procedureGroups.get(row.id) ?? []).map((procedure) => procedure.id),
        ),
      ),
    );
    const procedureTranslations = await fetchProcedureTranslations(
      procedureIds,
      "ar",
    );
    const procedureTranslationsByProcedureId = new Map(
      procedureTranslations.map((translation) => [
        translation.treatment_procedure_id,
        translation,
      ]),
    );
    const translationsByTreatmentId = new Map(
      translations
        .filter((translation): translation is TreatmentTranslationRow =>
          Boolean(translation),
        )
        .map((translation) => [translation.treatment_id, translation]),
    );

    return rows.map((row) => {
      const procedures = (procedureGroups.get(row.id) ?? []).sort(
        (first, second) =>
          (first.display_order ?? 0) - (second.display_order ?? 0),
      );
      const translation = translationsByTreatmentId.get(row.id);

      return {
        ...row,
        grade: metadata.get(row.id) ?? DEFAULT_GRADE,
        procedures,
        translation: {
          exists: Boolean(translation),
          locale: "ar" as const,
          status:
            (translation?.status as TreatmentTranslationStatus | undefined) ??
            null,
          is_stale: translation?.is_stale ?? false,
          source_updated_at: translation?.source_updated_at ?? null,
          updated_at: translation?.updated_at ?? null,
          name: translation?.name ?? null,
          category_label: translation?.category_label ?? null,
          summary: translation?.summary ?? null,
          description: translation?.description ?? null,
          overview: translation?.overview ?? null,
          ideal_candidates: sanitizeStringArray(
            translation?.ideal_candidates ?? [],
          ),
          seo: translation?.seo ?? null,
        },
        procedure_translations: procedures
          .map((procedure) =>
            procedureTranslationsByProcedureId.get(procedure.id),
          )
          .filter(
            (
              translationRow,
            ): translationRow is TreatmentProcedureTranslationRow =>
              Boolean(translationRow),
          ),
      } satisfies ArabicTreatmentResponse;
    });
  },

  async get(id: unknown, locale: AdminTreatmentLocale = "en") {
    const treatmentId = treatmentIdSchema.parse(id);
    const treatment = await fetchTreatmentWithProcedures(treatmentId);

    if (locale === "ar") {
      return buildArabicResponse(treatment);
    }

    const grade = await fetchTreatmentGrade(treatment.id);
    return { ...treatment, grade };
  },

  async create(payload: unknown, locale: AdminTreatmentLocale = "en") {
    if (locale === "ar") {
      throw new ApiError(400, "Create the English treatment first");
    }

    const parsed = createTreatmentSchema.parse(payload);

    const createPayload: TreatmentInsert = {
      name: parsed.name,
      slug: parsed.slug,
      category: parsed.category ?? null,
      summary: parsed.summary ?? null,
      description: parsed.description ?? null,
      overview: parsed.overview ?? null,
      download_url: parsed.download_url ?? null,
      card_image_url: parsed.card_image_url ?? null,
      hero_image_url: parsed.hero_image_url ?? null,
      base_price: parsed.base_price ?? null,
      currency: parsed.currency ?? null,
      duration_days: parsed.duration_days ?? null,
      recovery_time_days: parsed.recovery_time_days ?? null,
      success_rate: parsed.success_rate ?? null,
      is_featured: parsed.is_featured ?? false,
      is_active: parsed.is_active ?? true,
      is_listed_public: parsed.is_listed_public ?? true,
      ideal_candidates: parsed.ideal_candidates ?? [],
    };

    const created = (await treatmentsService.create(
      createPayload,
    )) as TreatmentRow;
    await upsertProcedures(created.id, parsed.procedures);
    const grade = await upsertTreatmentGrade(
      created.id,
      parsed.grade ?? DEFAULT_GRADE,
    );
    const treatment = await fetchTreatmentWithProcedures(created.id);

    revalidateTreatmentPages(treatment.slug);
    return { ...treatment, grade };
  },

  async update(
    id: unknown,
    payload: unknown,
    locale: AdminTreatmentLocale = "en",
  ) {
    const treatmentId = treatmentIdSchema.parse(id);

    if (locale === "ar") {
      const parsed = arabicTreatmentSchema.parse(payload);
      await upsertArabicTranslations(treatmentId, parsed);
      const treatment = await fetchTreatmentWithProcedures(treatmentId);
      revalidateTreatmentPages(treatment.slug);
      return buildArabicResponse(treatment);
    }

    const parsed = updateTreatmentSchema.parse(payload);
    const existingTreatment = await fetchTreatmentWithProcedures(treatmentId);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const updatePayload: TreatmentUpdate = {};
    let hasBaseFieldUpdate = false;

    if (parsed.name !== undefined) {
      updatePayload.name = parsed.name;
      hasBaseFieldUpdate = true;
    }
    if (parsed.slug !== undefined) {
      updatePayload.slug = parsed.slug;
      hasBaseFieldUpdate = true;
    }
    if (parsed.category !== undefined) {
      updatePayload.category = parsed.category ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.summary !== undefined) {
      updatePayload.summary = parsed.summary ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.description !== undefined) {
      updatePayload.description = parsed.description ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.overview !== undefined) {
      updatePayload.overview = parsed.overview ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.download_url !== undefined) {
      updatePayload.download_url = parsed.download_url ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.card_image_url !== undefined) {
      updatePayload.card_image_url = parsed.card_image_url ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.hero_image_url !== undefined) {
      updatePayload.hero_image_url = parsed.hero_image_url ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.base_price !== undefined) {
      updatePayload.base_price = parsed.base_price ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.currency !== undefined) {
      updatePayload.currency = parsed.currency ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.duration_days !== undefined) {
      updatePayload.duration_days = parsed.duration_days ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.recovery_time_days !== undefined) {
      updatePayload.recovery_time_days = parsed.recovery_time_days ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.success_rate !== undefined) {
      updatePayload.success_rate = parsed.success_rate ?? null;
      hasBaseFieldUpdate = true;
    }
    if (parsed.is_featured !== undefined) {
      updatePayload.is_featured = parsed.is_featured;
      hasBaseFieldUpdate = true;
    }
    if (parsed.is_active !== undefined) {
      updatePayload.is_active = parsed.is_active;
      hasBaseFieldUpdate = true;
    }
    if (parsed.is_listed_public !== undefined) {
      updatePayload.is_listed_public = parsed.is_listed_public;
      hasBaseFieldUpdate = true;
    }
    if (parsed.ideal_candidates !== undefined) {
      updatePayload.ideal_candidates = parsed.ideal_candidates ?? [];
      hasBaseFieldUpdate = true;
    }

    const previousSlug = existingTreatment.slug?.trim();
    let updatedBase: TreatmentRow = existingTreatment;

    if (hasBaseFieldUpdate) {
      updatedBase = (await treatmentsService.update(
        treatmentId,
        updatePayload,
      )) as TreatmentRow;
    }

    const nextSlug = updatedBase.slug?.trim();

    if (previousSlug && nextSlug && previousSlug !== nextSlug) {
      try {
        await recordPathRedirect({
          fromPath: `/treatments/${previousSlug}`,
          toPath: `/treatments/${nextSlug}`,
          source: "admin.treatments.update",
          sourceMetadata: { treatmentId },
        });
      } catch (redirectError) {
        console.error("Failed to record treatment redirect", {
          treatmentId,
          previousSlug,
          nextSlug,
          redirectError,
        });
      }
    }

    if (parsed.procedures !== undefined) {
      await upsertProcedures(treatmentId, parsed.procedures ?? []);
    }

    const grade = Object.prototype.hasOwnProperty.call(parsed, "grade")
      ? await upsertTreatmentGrade(treatmentId, parsed.grade ?? DEFAULT_GRADE)
      : await fetchTreatmentGrade(treatmentId);

    const treatment = await fetchTreatmentWithProcedures(treatmentId);
    const hasTranslatableChange =
      havePublicTreatmentFieldsChanged(existingTreatment, treatment) ||
      havePublicProcedureFieldsChanged(
        existingTreatment.procedures,
        treatment.procedures,
      );

    if (hasTranslatableChange) {
      await markTreatmentTranslationsStale(
        treatmentId,
        getSourceUpdatedAt(treatment),
      );
    }

    revalidateTreatmentPages(treatment.slug, previousSlug);
    return { ...treatment, grade };
  },

  async createProviderProcedure(providerId: unknown, payload: unknown) {
    const providerIdSchema = z.string().uuid();
    const parsedProviderId = providerIdSchema.parse(providerId);
    const parsed = providerProcedureSchema.parse(payload);

    const supabase = getSupabaseAdmin();

    const { data: provider, error: providerError } = await supabase
      .from("service_providers")
      .select("procedure_ids")
      .eq("id", parsedProviderId)
      .maybeSingle();

    if (providerError) {
      throw new ApiError(
        500,
        "Failed to load service provider",
        providerError.message,
      );
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }

    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments")
      .select("category")
      .eq("id", parsed.treatmentId)
      .maybeSingle();

    if (treatmentError) {
      throw new ApiError(
        500,
        "Failed to load treatment",
        treatmentError.message,
      );
    }

    if (!treatment?.category || treatment.category.trim().length === 0) {
      throw new ApiError(
        400,
        "Treatment specialty is required before adding procedures",
      );
    }

    const existingTreatment = await fetchTreatmentWithProcedures(
      parsed.treatmentId,
    );
    const displayOrder =
      Math.max(
        -1,
        ...existingTreatment.procedures.map(
          (procedure) => procedure.display_order ?? 0,
        ),
      ) + 1;
    const payloadToInsert = buildProcedurePayload(
      parsed.treatmentId,
      {
        ...parsed.procedure,
        createdByProviderId: parsedProviderId,
        isPublic: parsed.procedure.isPublic ?? true,
      },
      displayOrder,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("treatment_procedures")
      .insert([payloadToInsert])
      .select("*")
      .single();

    if (insertError) {
      throw new ApiError(
        500,
        "Failed to create procedure for provider",
        insertError.message,
      );
    }

    const existingIds = Array.isArray(provider.procedure_ids)
      ? provider.procedure_ids.filter((entry): entry is string =>
          Boolean(entry),
        )
      : [];

    if (!existingIds.includes(inserted.id)) {
      const { error: updateError } = await supabase
        .from("service_providers")
        .update({ procedure_ids: [...existingIds, inserted.id] })
        .eq("id", parsedProviderId);

      if (updateError) {
        throw new ApiError(
          500,
          "Failed to link procedure to provider",
          updateError.message,
        );
      }
    }

    return inserted;
  },

  async deleteProviderProcedure(providerId: unknown, procedureId: unknown) {
    const providerIdSchema = z.string().uuid();
    const parsedProviderId = providerIdSchema.parse(providerId);
    const parsedProcedureId = z.string().uuid().parse(procedureId);

    const supabase = getSupabaseAdmin();

    const { data: existingPriceLists, error: existingPriceListsError } =
      await supabase
        .from("service_provider_procedure_price_lists")
        .select("id, service_provider_id")
        .eq("procedure_id", parsedProcedureId);

    if (existingPriceListsError) {
      throw new ApiError(
        500,
        "Failed to inspect procedure price list usage",
        existingPriceListsError.message,
      );
    }

    const existingPriceListProviderIds = Array.from(
      new Set(
        (existingPriceLists ?? [])
          .map((row) => row.service_provider_id)
          .filter((entry): entry is string => Boolean(entry)),
      ),
    );

    const { data: procedure, error: procedureError } = await supabase
      .from("treatment_procedures")
      .select("id, created_by_provider_id")
      .eq("id", parsedProcedureId)
      .maybeSingle();

    if (procedureError) {
      throw new ApiError(
        500,
        "Failed to load provider procedure",
        procedureError.message,
      );
    }

    if (!procedure) {
      throw new ApiError(404, "Procedure not found");
    }

    if (procedure.created_by_provider_id !== parsedProviderId) {
      throw new ApiError(403, "Procedure is not owned by this provider");
    }

    if ((existingPriceLists ?? []).length > 0) {
      let linkedProviderLabels: string[] = existingPriceListProviderIds;

      if (existingPriceListProviderIds.length > 0) {
        const { data: linkedProviders, error: linkedProvidersError } =
          await supabase
            .from("service_providers")
            .select("id, name")
            .in("id", existingPriceListProviderIds);

        if (linkedProvidersError) {
          throw new ApiError(
            500,
            "Failed to load linked providers for procedure delete guard",
            linkedProvidersError.message,
          );
        }

        linkedProviderLabels = (linkedProviders ?? [])
          .map((entry) => `${entry.name} (${entry.id})`)
          .sort((first, second) => first.localeCompare(second));
      }

      throw new ApiError(
        409,
        "Cannot delete provider procedure while active price lists exist",
        `Delete price list entries for this procedure first. Linked provider(s): ${linkedProviderLabels.join(", ")}`,
      );
    }

    const { data: provider, error: providerError } = await supabase
      .from("service_providers")
      .select("procedure_ids")
      .eq("id", parsedProviderId)
      .maybeSingle();

    if (providerError) {
      throw new ApiError(
        500,
        "Failed to load service provider",
        providerError.message,
      );
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }

    const { error: deleteError } = await supabase
      .from("treatment_procedures")
      .delete()
      .eq("id", parsedProcedureId);

    if (deleteError) {
      throw new ApiError(
        500,
        "Failed to delete provider procedure",
        deleteError.message,
      );
    }

    const sanitizedProcedureIds = (
      Array.isArray(provider.procedure_ids) ? provider.procedure_ids : []
    )
      .filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.length > 0,
      )
      .filter((entry) => entry !== parsedProcedureId);

    const { error: updateError } = await supabase
      .from("service_providers")
      .update({ procedure_ids: sanitizedProcedureIds })
      .eq("id", parsedProviderId);

    if (updateError) {
      console.error(
        "Failed to unlink deleted procedure from provider procedure_ids",
        {
          providerId: parsedProviderId,
          procedureId: parsedProcedureId,
          error: updateError,
        },
      );
    }

    return { success: true };
  },

  async delete(id: unknown, locale: AdminTreatmentLocale = "en") {
    const treatmentId = treatmentIdSchema.parse(id);

    if (locale === "ar") {
      const treatment = await fetchTreatmentWithProcedures(treatmentId);
      await deleteArabicTranslations(treatmentId);
      revalidateTreatmentPages(treatment.slug);
      return { success: true };
    }

    const treatment = await fetchTreatmentWithProcedures(treatmentId);
    const supabase = getSupabaseAdmin();
    const procedureIds = treatment.procedures.map((procedure) => procedure.id);

    if (procedureIds.length > 0) {
      const { error } = await supabase
        .from("treatment_procedures")
        .delete()
        .in("id", procedureIds);

      if (error) {
        throw new ApiError(
          500,
          "Failed to reset treatment procedures",
          error.message,
        );
      }
    }

    const result = await treatmentsService.remove(treatmentId);
    revalidateTreatmentPages(treatment.slug);
    return result;
  },
};
