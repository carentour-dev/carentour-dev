import type { Database } from "@/integrations/supabase/types";

export type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
export type TreatmentProcedureRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];

export type TreatmentProcedure = {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  recovery?: string;
  price?: string;
  egyptPrice?: number | null;
  successRate?: string;
  candidateRequirements: string[];
  recoveryStages: {
    stage: string;
    description: string;
  }[];
  internationalPrices: {
    country: string;
    flag?: string;
    price: number;
    currency: string;
  }[];
  displayOrder: number;
};

export type NormalizedTreatment = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  summary?: string | null;
  description?: string | null;
  overview?: string | null;
  basePrice?: number | null;
  currency?: string | null;
  durationDays?: number | null;
  recoveryTimeDays?: number | null;
  successRate?: number | null;
  isFeatured?: boolean | null;
  isActive?: boolean | null;
  idealCandidates: string[];
  procedures: TreatmentProcedure[];
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeProcedureRow = (
  row: TreatmentProcedureRow,
): TreatmentProcedure => {
  const recoveryStagesArray = Array.isArray(row.recovery_stages)
    ? (row.recovery_stages as unknown[])
        .map((stage) => {
          if (!stage || typeof stage !== "object") return null;
          const value = stage as Record<string, unknown>;
          if (
            !isNonEmptyString(value.stage) ||
            !isNonEmptyString(value.description)
          ) {
            return null;
          }
          return {
            stage: value.stage.trim(),
            description: value.description.trim(),
          };
        })
        .filter((entry): entry is { stage: string; description: string } =>
          Boolean(entry),
        )
    : [];

  const candidateRequirements = Array.isArray(row.candidate_requirements)
    ? row.candidate_requirements
        .filter(isNonEmptyString)
        .map((entry) => entry.trim())
    : [];

  const internationalPricesArray = Array.isArray(row.international_prices)
    ? (row.international_prices as unknown[])
        .map((price) => {
          if (!price || typeof price !== "object") return null;
          const value = price as Record<string, unknown>;
          const country = isNonEmptyString(value.country)
            ? value.country.trim()
            : "";
          const currency = isNonEmptyString(value.currency)
            ? value.currency.trim()
            : "";
          const flag = isNonEmptyString(value.flag)
            ? value.flag.trim()
            : undefined;
          const rawPrice = value.price;
          const priceNumber =
            typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
          if (!country || !currency || Number.isNaN(priceNumber)) {
            return null;
          }
          return {
            country,
            currency,
            price: priceNumber,
            ...(flag ? { flag } : {}),
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            country: string;
            currency: string;
            price: number;
            flag?: string;
          } => Boolean(entry),
        )
    : [];

  const rawSuccessRate =
    typeof row.success_rate === "string" ? row.success_rate.trim() : null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    duration: row.duration ?? undefined,
    recovery: row.recovery ?? undefined,
    price: row.price ?? undefined,
    egyptPrice:
      typeof row.egypt_price === "number" && Number.isFinite(row.egypt_price)
        ? row.egypt_price
        : null,
    successRate:
      rawSuccessRate && rawSuccessRate.length > 0 ? rawSuccessRate : undefined,
    candidateRequirements,
    recoveryStages: recoveryStagesArray,
    internationalPrices: internationalPricesArray,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
  };
};

export const normalizeTreatment = (
  treatment: TreatmentRow,
  procedureRows: TreatmentProcedureRow[] = [],
): NormalizedTreatment => {
  const idealCandidates = Array.isArray(treatment.ideal_candidates)
    ? treatment.ideal_candidates
        .filter(isNonEmptyString)
        .map((entry) => entry.trim())
    : [];

  const procedures = procedureRows
    .map((row) => normalizeProcedureRow(row))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    id: treatment.id,
    name: treatment.name,
    slug: treatment.slug,
    category: treatment.category,
    summary: treatment.summary,
    description: treatment.description,
    overview: treatment.overview,
    basePrice: treatment.base_price,
    currency: treatment.currency,
    durationDays: treatment.duration_days,
    recoveryTimeDays: treatment.recovery_time_days,
    successRate: treatment.success_rate,
    isFeatured: treatment.is_featured,
    isActive: treatment.is_active,
    idealCandidates,
    procedures,
  };
};

export const selectPrimaryProcedure = (
  procedures: TreatmentProcedure[],
): TreatmentProcedure | null => {
  if (procedures.length === 0) return null;
  const prioritized = procedures.find(
    (procedure) =>
      typeof procedure.egyptPrice === "number" &&
      procedure.internationalPrices.length > 0,
  );
  return prioritized ?? procedures[0] ?? null;
};

export const buildPriceComparison = (
  procedures: TreatmentProcedure[],
): {
  egyptPrice: number;
  internationalPrices: TreatmentProcedure["internationalPrices"];
} | null => {
  const procedure = selectPrimaryProcedure(procedures);
  if (
    !procedure ||
    typeof procedure.egyptPrice !== "number" ||
    procedure.internationalPrices.length === 0
  ) {
    return null;
  }

  return {
    egyptPrice: procedure.egyptPrice,
    internationalPrices: procedure.internationalPrices,
  };
};
