import type { Database } from "@/integrations/supabase/types";

export type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];

export type TreatmentProcedure = {
  name: string;
  description?: string;
  duration?: string;
  recovery?: string;
  price?: string;
  egyptPrice?: number;
  success_rate?: string;
  internationalPrices: {
    country: string;
    flag?: string;
    price: number;
    currency: string;
  }[];
  candidateRequirements: string[];
  recoveryStages: {
    stage: string;
    description: string;
  }[];
};

export type NormalizedTreatment = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  summary?: string | null;
  description?: string | null;
  overview?: string | null;
  base_price?: number | null;
  currency?: string | null;
  duration_days?: number | null;
  recovery_time_days?: number | null;
  success_rate?: number | null;
  is_active?: boolean | null;
  idealCandidates: string[];
  procedures: TreatmentProcedure[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeProcedure = (value: unknown): TreatmentProcedure | null => {
  if (!isRecord(value)) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    return null;
  }

  const description = typeof value.description === "string" ? value.description.trim() : undefined;
  const duration = typeof value.duration === "string" ? value.duration.trim() : undefined;
  const recovery = typeof value.recovery === "string" ? value.recovery.trim() : undefined;
  const price = typeof value.price === "string" ? value.price.trim() : undefined;
  const egyptPrice = parseNumber(value.egyptPrice);
  const successRate = typeof value.success_rate === "string" ? value.success_rate.trim() : undefined;

  const candidateRequirements = Array.isArray(value.candidateRequirements)
    ? value.candidateRequirements.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  const recoveryStages = Array.isArray(value.recoveryStages)
    ? value.recoveryStages
        .filter(isRecord)
        .map((stage) => ({
          stage: typeof stage.stage === "string" ? stage.stage.trim() : "",
          description: typeof stage.description === "string" ? stage.description.trim() : "",
        }))
        .filter((stage) => stage.stage.length > 0 && stage.description.length > 0)
    : [];

  const internationalPrices = Array.isArray(value.internationalPrices)
    ? value.internationalPrices
        .filter(isRecord)
        .map((countryPrice) => ({
          country: typeof countryPrice.country === "string" ? countryPrice.country.trim() : "",
          flag: typeof countryPrice.flag === "string" ? countryPrice.flag.trim() : undefined,
          price: parseNumber(countryPrice.price) ?? 0,
          currency: typeof countryPrice.currency === "string" ? countryPrice.currency.trim() : "",
        }))
        .filter((countryPrice) => countryPrice.country && countryPrice.currency)
    : [];

  return {
    name,
    description,
    duration,
    recovery,
    price,
    egyptPrice,
    success_rate: successRate,
    internationalPrices,
    candidateRequirements,
    recoveryStages,
  };
};

export const normalizeTreatment = (treatment: TreatmentRow): NormalizedTreatment => {
  const idealCandidates = Array.isArray(treatment.ideal_candidates)
    ? treatment.ideal_candidates.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  const procedures = Array.isArray(treatment.procedures)
    ? treatment.procedures
        .map((procedure) => normalizeProcedure(procedure))
        .filter((procedure): procedure is TreatmentProcedure => Boolean(procedure))
    : [];

  return {
    id: treatment.id,
    name: treatment.name,
    slug: treatment.slug,
    category: treatment.category,
    summary: treatment.summary,
    description: treatment.description,
    overview: treatment.overview,
    base_price: treatment.base_price,
    currency: treatment.currency,
    duration_days: treatment.duration_days,
    recovery_time_days: treatment.recovery_time_days,
    success_rate: treatment.success_rate,
    is_active: treatment.is_active,
    idealCandidates,
    procedures,
  };
};

export const getPrimaryProcedure = (procedures: TreatmentProcedure[]): TreatmentProcedure | null => {
  if (procedures.length === 0) return null;

  const prioritized = procedures.find(
    (procedure) => procedure.egyptPrice && procedure.internationalPrices.length > 0,
  );

  return prioritized ?? procedures[0] ?? null;
};

export const getPriceComparison = (
  procedures: TreatmentProcedure[],
): {
  egyptPrice: number;
  internationalPrices: TreatmentProcedure["internationalPrices"];
} | null => {
  const procedure = getPrimaryProcedure(procedures);

  if (!procedure || !procedure.egyptPrice || procedure.internationalPrices.length === 0) {
    return null;
  }

  return {
    egyptPrice: procedure.egyptPrice,
    internationalPrices: procedure.internationalPrices,
  };
};
