import type { PublicLocale } from "@/i18n/routing";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  normalizeTreatment,
  type NormalizedTreatment,
  type TreatmentProcedure,
} from "@/lib/treatments";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentProcedureRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];
type TreatmentTranslationRow =
  Database["public"]["Tables"]["treatment_translations"]["Row"];
type TreatmentProcedureTranslationRow =
  Database["public"]["Tables"]["treatment_procedure_translations"]["Row"];

type TreatmentWithProcedures = TreatmentRow & {
  treatment_procedures: TreatmentProcedureRow[];
};

type TreatmentSeoSnapshot = {
  title: string | null;
  description: string | null;
};

export type LocalizedPublicTreatmentDetail = {
  treatment: NormalizedTreatment;
  seo: TreatmentSeoSnapshot;
  updatedAt: string | null;
};

export type LocalizedTreatmentSeoInventoryEntry = {
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  card_image_url: string | null;
  updated_at: string | null;
  seo: TreatmentSeoSnapshot;
};

const TREATMENT_PUBLIC_SELECT =
  "id, name, slug, summary, description, overview, category, base_price, currency, duration_days, recovery_time_days, success_rate, is_featured, is_active, is_listed_public, ideal_candidates, download_url, card_image_url, hero_image_url, created_at, updated_at, treatment_procedures:treatment_procedures(*)";

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

const sanitizeRecoveryStages = (
  value: Json | null,
): TreatmentProcedure["recoveryStages"] => {
  if (!Array.isArray(value)) {
    return [];
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

const isVisiblePublicProcedure = (procedure: TreatmentProcedureRow) =>
  procedure.created_by_provider_id == null && procedure.is_public !== false;

const buildTranslatedSeoSnapshot = (
  translation: TreatmentTranslationRow | null,
  localizedTreatment: NormalizedTreatment,
): TreatmentSeoSnapshot => {
  const seo =
    translation?.seo && typeof translation.seo === "object"
      ? (translation.seo as Record<string, unknown>)
      : null;

  return {
    title: trimNullableString(seo?.title) ?? localizedTreatment.name,
    description:
      trimNullableString(seo?.description) ??
      localizedTreatment.summary ??
      localizedTreatment.description ??
      null,
  };
};

const applyProcedureTranslation = (
  procedure: TreatmentProcedure,
  translation: TreatmentProcedureTranslationRow | null,
): TreatmentProcedure => {
  if (!translation) {
    return procedure;
  }

  return {
    ...procedure,
    name: trimNullableString(translation.name) ?? "",
    description: translation.description ?? undefined,
    duration: translation.duration ?? undefined,
    recovery: translation.recovery ?? undefined,
    price: translation.price ?? undefined,
    successRate: translation.success_rate ?? undefined,
    additionalNotes: translation.additional_notes ?? undefined,
    candidateRequirements: sanitizeStringArray(
      translation.candidate_requirements ?? [],
    ),
    recoveryStages: sanitizeRecoveryStages(translation.recovery_stages),
  };
};

const applyTreatmentTranslation = (
  treatment: NormalizedTreatment,
  translation: TreatmentTranslationRow,
  procedureTranslationsById: Map<string, TreatmentProcedureTranslationRow>,
): NormalizedTreatment => {
  return {
    ...treatment,
    name: trimNullableString(translation.name) ?? "",
    category: trimNullableString(translation.category_label),
    summary: translation.summary,
    description: translation.description,
    overview: translation.overview,
    idealCandidates: sanitizeStringArray(translation.ideal_candidates ?? []),
    procedures: treatment.procedures.map((procedure) =>
      applyProcedureTranslation(
        procedure,
        procedureTranslationsById.get(procedure.id) ?? null,
      ),
    ),
  };
};

async function getPublishedTreatmentTranslations(treatmentIds: string[]) {
  if (treatmentIds.length === 0) {
    return [] as TreatmentTranslationRow[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_translations")
    .select("*")
    .eq("locale", "ar")
    .eq("status", "published")
    .in("treatment_id", treatmentIds);

  if (error) {
    console.error("Failed to load treatment translations", error);
    return [];
  }

  return (data ?? []) as TreatmentTranslationRow[];
}

async function getProcedureTranslations(procedureIds: string[]) {
  if (procedureIds.length === 0) {
    return [] as TreatmentProcedureTranslationRow[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatment_procedure_translations")
    .select("*")
    .eq("locale", "ar")
    .in("treatment_procedure_id", procedureIds);

  if (error) {
    console.error("Failed to load treatment procedure translations", error);
    return [];
  }

  return (data ?? []) as TreatmentProcedureTranslationRow[];
}

function localizeTreatmentRows(
  rows: TreatmentWithProcedures[],
  translations: TreatmentTranslationRow[],
  procedureTranslations: TreatmentProcedureTranslationRow[],
) {
  const translationsByTreatmentId = new Map(
    translations.map((translation) => [translation.treatment_id, translation]),
  );
  const procedureTranslationsById = new Map(
    procedureTranslations.map((translation) => [
      translation.treatment_procedure_id,
      translation,
    ]),
  );

  return rows
    .filter((row) => translationsByTreatmentId.has(row.id))
    .map((row) => {
      const normalized = normalizeTreatment(
        row,
        row.treatment_procedures ?? [],
      );
      const translation = translationsByTreatmentId.get(row.id)!;
      const localizedTreatment = applyTreatmentTranslation(
        normalized,
        translation,
        procedureTranslationsById,
      );

      return {
        treatment: localizedTreatment,
        translation,
      };
    });
}

export async function getLocalizedPublicTreatments(input: {
  locale: PublicLocale;
  limit?: number;
  manualTreatments?: string[];
  featuredOnly?: boolean;
  categories?: string[];
}) {
  const supabase = getSupabaseAdmin();
  const limit =
    typeof input.limit === "number" && input.limit > 0 ? input.limit : 50;
  const manualTreatments = (input.manualTreatments ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  let query = supabase
    .from("treatments")
    .select(TREATMENT_PUBLIC_SELECT)
    .eq("is_active", true)
    .eq("is_listed_public", true);

  if (manualTreatments.length > 0) {
    query = query.in("slug", manualTreatments);
  }

  if (input.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (input.categories && input.categories.length > 0) {
    query = query.in("category", input.categories);
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to load localized public treatments", error);
    return [] as NormalizedTreatment[];
  }

  const rows = (data ?? []) as TreatmentWithProcedures[];

  if (input.locale === "en") {
    const normalized = rows.map((row) =>
      normalizeTreatment(row, row.treatment_procedures ?? []),
    );

    if (manualTreatments.length === 0) {
      return normalized;
    }

    const orderMap = new Map(
      manualTreatments.map((slug, index) => [slug, index] as const),
    );

    return normalized.sort((first, second) => {
      const rankFirst =
        orderMap.get(first.slug ?? first.id) ?? Number.MAX_SAFE_INTEGER;
      const rankSecond =
        orderMap.get(second.slug ?? second.id) ?? Number.MAX_SAFE_INTEGER;
      return rankFirst - rankSecond;
    });
  }

  const treatmentIds = rows.map((row) => row.id);
  const visibleProcedureIds = rows.flatMap((row) =>
    (row.treatment_procedures ?? [])
      .filter(isVisiblePublicProcedure)
      .map((procedure) => procedure.id),
  );
  const [translations, procedureTranslations] = await Promise.all([
    getPublishedTreatmentTranslations(treatmentIds),
    getProcedureTranslations(visibleProcedureIds),
  ]);

  const localized = localizeTreatmentRows(
    rows,
    translations,
    procedureTranslations,
  ).map((entry) => entry.treatment);

  if (manualTreatments.length === 0) {
    return localized;
  }

  const orderMap = new Map(
    manualTreatments.map((slug, index) => [slug, index] as const),
  );

  return localized.sort((first, second) => {
    const rankFirst =
      orderMap.get(first.slug ?? first.id) ?? Number.MAX_SAFE_INTEGER;
    const rankSecond =
      orderMap.get(second.slug ?? second.id) ?? Number.MAX_SAFE_INTEGER;
    return rankFirst - rankSecond;
  });
}

export async function getLocalizedPublicTreatmentDetail(
  locale: PublicLocale,
  slug: string,
): Promise<LocalizedPublicTreatmentDetail | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select(TREATMENT_PUBLIC_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("is_listed_public", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load public treatment detail", { slug, error });
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as TreatmentWithProcedures;
  const normalized = normalizeTreatment(row, row.treatment_procedures ?? []);

  if (locale === "en") {
    return {
      treatment: normalized,
      seo: {
        title: `${normalized.name} | Treatments | Care N Tour`,
        description: normalized.summary ?? normalized.description ?? null,
      },
      updatedAt: row.updated_at,
    };
  }

  const visibleProcedureIds = (row.treatment_procedures ?? [])
    .filter(isVisiblePublicProcedure)
    .map((procedure) => procedure.id);
  const [translations, procedureTranslations] = await Promise.all([
    getPublishedTreatmentTranslations([row.id]),
    getProcedureTranslations(visibleProcedureIds),
  ]);

  const translation = translations[0] ?? null;
  if (!translation) {
    return null;
  }

  const procedureTranslationsById = new Map(
    procedureTranslations.map((entry) => [entry.treatment_procedure_id, entry]),
  );
  const localizedTreatment = applyTreatmentTranslation(
    normalized,
    translation,
    procedureTranslationsById,
  );

  return {
    treatment: localizedTreatment,
    seo: buildTranslatedSeoSnapshot(translation, localizedTreatment),
    updatedAt:
      translation.updated_at && translation.updated_at > row.updated_at
        ? translation.updated_at
        : row.updated_at,
  };
}

export async function getLocalizedPublicTreatmentIndexItems(
  locale: PublicLocale,
  limit = 50,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select("id, slug, name")
    .eq("is_active", true)
    .eq("is_listed_public", true)
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to load treatment index items", error);
    return [];
  }

  const rows = (data ?? []) as Array<
    Pick<TreatmentRow, "id" | "slug" | "name">
  >;

  if (locale === "en") {
    return rows
      .map((entry) => ({
        name: trimNullableString(entry.name),
        path: trimNullableString(entry.slug)
          ? `/treatments/${entry.slug.trim()}`
          : null,
      }))
      .filter((entry): entry is { name: string; path: string } =>
        Boolean(entry.name && entry.path),
      );
  }

  const translations = await getPublishedTreatmentTranslations(
    rows.map((row) => row.id),
  );
  const translationsByTreatmentId = new Map(
    translations.map((translation) => [translation.treatment_id, translation]),
  );

  return rows
    .map((entry) => {
      const translation = translationsByTreatmentId.get(entry.id);
      return {
        name: trimNullableString(translation?.name),
        path: trimNullableString(entry.slug)
          ? `/treatments/${entry.slug.trim()}`
          : null,
      };
    })
    .filter((entry): entry is { name: string; path: string } =>
      Boolean(entry.name && entry.path),
    );
}

export async function hasPublishedArabicTreatmentTranslation(slug: string) {
  const detail = await getLocalizedPublicTreatmentDetail("ar", slug);
  return detail !== null;
}

export async function getLocalizedTreatmentSeoInventory(
  locale: PublicLocale,
): Promise<LocalizedTreatmentSeoInventoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select(
      "id, slug, name, summary, description, hero_image_url, card_image_url, updated_at",
    )
    .eq("is_active", true)
    .eq("is_listed_public", true);

  if (error) {
    console.error("Failed to load treatment SEO inventory", error);
    return [];
  }

  const rows = (data ?? []) as Array<
    Pick<
      TreatmentRow,
      | "id"
      | "slug"
      | "name"
      | "summary"
      | "description"
      | "hero_image_url"
      | "card_image_url"
      | "updated_at"
    >
  >;

  if (locale === "en") {
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      summary: row.summary,
      description: row.description,
      hero_image_url: row.hero_image_url,
      card_image_url: row.card_image_url,
      updated_at: row.updated_at,
      seo: {
        title: `${row.name} | Treatments | Care N Tour`,
        description: row.summary ?? row.description ?? null,
      },
    }));
  }

  const translations = await getPublishedTreatmentTranslations(
    rows.map((row) => row.id),
  );
  const translationsByTreatmentId = new Map(
    translations.map((translation) => [translation.treatment_id, translation]),
  );

  return rows
    .map((row) => {
      const translation = translationsByTreatmentId.get(row.id);
      if (!translation) {
        return null;
      }

      const localizedName = trimNullableString(translation.name) ?? "";
      const localizedSummary = translation.summary ?? null;
      const localizedDescription = translation.description ?? null;
      const seoRecord =
        translation.seo && typeof translation.seo === "object"
          ? (translation.seo as Record<string, unknown>)
          : null;

      return {
        slug: row.slug,
        name: localizedName,
        summary: localizedSummary,
        description: localizedDescription,
        hero_image_url: row.hero_image_url,
        card_image_url: row.card_image_url,
        updated_at:
          translation.updated_at && translation.updated_at > row.updated_at
            ? translation.updated_at
            : row.updated_at,
        seo: {
          title:
            trimNullableString(seoRecord?.title) ??
            `${localizedName} | Treatments | Care N Tour`,
          description:
            trimNullableString(seoRecord?.description) ??
            localizedSummary ??
            localizedDescription ??
            null,
        },
      } satisfies LocalizedTreatmentSeoInventoryEntry;
    })
    .filter((entry): entry is LocalizedTreatmentSeoInventoryEntry =>
      Boolean(entry),
    );
}
