import type { NormalizedTreatment, TreatmentProcedure } from "@/lib/treatments";

export type TreatmentProcedureDirectoryFilters = {
  search?: string;
  procedureId?: string;
};

export type TreatmentProcedureDirectoryState = {
  procedures: TreatmentProcedure[];
  total: number;
  filtered: number;
};

const normalize = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const matchesProcedureFilter = (
  procedure: TreatmentProcedure,
  procedureId: string,
) => {
  if (!procedureId) {
    return true;
  }

  return procedure.id === procedureId;
};

export const matchesTreatmentProcedureSearch = (
  treatment: NormalizedTreatment,
  procedure: TreatmentProcedure,
  searchTerm: string,
) => {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    treatment.name,
    treatment.category,
    procedure.name,
    procedure.description,
    procedure.duration,
    procedure.recovery,
    procedure.price,
    procedure.successRate,
    procedure.additionalNotes,
    ...procedure.candidateRequirements,
    ...procedure.recoveryStages.flatMap((stage) => [
      stage.stage,
      stage.description,
    ]),
    ...procedure.internationalPrices.flatMap((price) => [
      price.country,
      price.currency,
    ]),
  ]
    .map((value) => normalize(value))
    .filter(Boolean);

  return haystack.some((value) => value.includes(searchTerm));
};

export function buildTreatmentProcedureDirectoryState(input: {
  treatment: NormalizedTreatment;
  filters?: TreatmentProcedureDirectoryFilters;
}): TreatmentProcedureDirectoryState {
  const filters = input.filters ?? {};
  const search = normalize(filters.search);
  const procedureId = filters.procedureId ?? "";

  const procedures = input.treatment.procedures.filter((procedure) => {
    if (!matchesTreatmentProcedureSearch(input.treatment, procedure, search)) {
      return false;
    }

    if (!matchesProcedureFilter(procedure, procedureId)) {
      return false;
    }

    return true;
  });

  return {
    procedures,
    total: input.treatment.procedures.length,
    filtered: procedures.length,
  };
}
