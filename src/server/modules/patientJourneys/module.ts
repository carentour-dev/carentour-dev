import { z } from "zod";
import type { AuthorizationContext } from "@/server/auth/requireAdmin";
import { normalizeRoles } from "@/lib/auth/roles";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const JOURNEY_STATUSES = ["active", "completed", "cancelled"] as const;
const STEP_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
] as const;
const SOURCE_TYPES = [
  "contact_request",
  "consultation_request",
  "start_journey_submission",
] as const;
const COORDINATOR_ASSIGNABLE_ROLES = new Set([
  "account_manager",
  "admin",
  "coordinator",
  "employee",
  "management",
]);
const ACCOUNT_MANAGER_ASSIGNABLE_ROLES = new Set([
  "account_manager",
  "admin",
  "management",
]);

export type PatientJourneyStatus = (typeof JOURNEY_STATUSES)[number];
export type PatientJourneyStepStatus = (typeof STEP_STATUSES)[number];
export type PatientJourneySourceType = (typeof SOURCE_TYPES)[number];

export type ProfileSummary = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
};

export type PatientJourneyStep = {
  id: string;
  journey_id: string;
  position: number;
  title: string;
  description: string | null;
  status: PatientJourneyStepStatus;
  coordinator_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientJourneySource = {
  id: string;
  journey_id: string;
  source_type: PatientJourneySourceType;
  source_id: string;
  created_at: string;
};

export type PatientJourneyIntakeSource = PatientJourneySource & {
  source_created_at: string | null;
  status: string | null;
  origin: string | null;
  patient_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  treatment: string | null;
  procedure: string | null;
  medical_context: string | null;
  message: string | null;
  budget_range: string | null;
  travel_window: string | null;
  companions: string | null;
  contact_preference: string | null;
  documents_count: number;
  notes: string | null;
  missing_source: boolean;
};

export type PatientJourney = {
  id: string;
  patient_id: string;
  account_manager_profile_id: string | null;
  assigned_coordinator_profile_id: string | null;
  status: PatientJourneyStatus;
  started_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    full_name: string;
    contact_email: string | null;
    contact_phone: string | null;
    nationality: string | null;
    status: string | null;
  } | null;
  account_manager_profile?: ProfileSummary | null;
  assigned_coordinator_profile?: ProfileSummary | null;
  steps?: PatientJourneyStep[];
  sources?: PatientJourneySource[];
  intake_sources?: PatientJourneyIntakeSource[];
};

const uuidSchema = z.string().uuid();
const optionalUuidSchema = z
  .preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  }, z.string().uuid().nullable().optional())
  .optional();

const listFiltersSchema = z.object({
  status: z.enum(JOURNEY_STATUSES).optional(),
  patientId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

const startJourneySchema = z.object({
  sourceType: z.enum(SOURCE_TYPES),
  sourceId: z.string().uuid(),
  patientId: optionalUuidSchema,
  coordinatorProfileId: z.string().uuid(),
});

const updateJourneySchema = z
  .object({
    status: z.enum(JOURNEY_STATUSES).optional(),
    account_manager_profile_id: optionalUuidSchema,
    assigned_coordinator_profile_id: optionalUuidSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const updateStepSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    position: z.number().int().positive().optional(),
    status: z.enum(STEP_STATUSES).optional(),
    coordinator_notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const createStepSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
});

const reorderStepsSchema = z.object({
  orderedStepIds: z.array(uuidSchema).min(1),
});

const JOURNEY_SELECT = `
  *,
  patient:patients!patient_journeys_patient_id_fkey(
    id,
    full_name,
    contact_email,
    contact_phone,
    nationality,
    status
  ),
  account_manager_profile:profiles!patient_journeys_account_manager_profile_id_fkey(
    id,
    username,
    email,
    avatar_url,
    job_title
  ),
  assigned_coordinator_profile:profiles!patient_journeys_assigned_coordinator_profile_id_fkey(
    id,
    username,
    email,
    avatar_url,
    job_title
  ),
  steps:patient_journey_steps(
    id,
    journey_id,
    position,
    title,
    description,
    status,
    coordinator_notes,
    completed_at,
    created_at,
    updated_at
  ),
  sources:patient_journey_sources(
    id,
    journey_id,
    source_type,
    source_id,
    created_at
  )
`;

const normalizeText = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type RawAssignableProfile = {
  id: string;
  profile_roles: Array<{
    role?: {
      slug?: string | null;
    } | null;
  }> | null;
};

const validateAssignableProfile = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profileId: string | null | undefined,
  allowedRoles: Set<string>,
  messages: {
    lookup: string;
    notFound: string;
    invalid: string;
  },
) => {
  if (!profileId) {
    return;
  }

  const { data, error } = await (supabase as any)
    .from("profiles")
    .select(
      `
        id,
        profile_roles:profile_roles(
          role:roles(
            slug
          )
        )
      `,
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, messages.lookup, error.message);
  }

  if (!data) {
    throw new ApiError(400, messages.notFound);
  }

  const rawProfile = data as RawAssignableProfile;
  const roles = normalizeRoles(
    (rawProfile.profile_roles ?? [])
      .map((entry) => entry?.role?.slug ?? "")
      .filter(Boolean),
  );

  if (!roles.some((role) => allowedRoles.has(role))) {
    throw new ApiError(400, messages.invalid);
  }
};

const validateAssignableCoordinator = (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profileId: string | null | undefined,
) =>
  validateAssignableProfile(supabase, profileId, COORDINATOR_ASSIGNABLE_ROLES, {
    lookup: "Failed to verify journey coordinator.",
    notFound: "Selected coordinator profile was not found.",
    invalid:
      "Selected coordinator must be a team member with operations access.",
  });

const validateAssignableAccountManager = (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profileId: string | null | undefined,
) =>
  validateAssignableProfile(
    supabase,
    profileId,
    ACCOUNT_MANAGER_ASSIGNABLE_ROLES,
    {
      lookup: "Failed to verify account manager.",
      notFound: "Selected account manager profile was not found.",
      invalid: "Selected account manager must have account manager access.",
    },
  );

const assertActiveJourney = (journey: PatientJourney, action: string) => {
  if (journey.status !== "active") {
    throw new ApiError(
      409,
      `Cannot ${action} a ${journey.status} patient journey.`,
    );
  }
};

const loadSourcePatientId = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sourceType: PatientJourneySourceType,
  sourceId: string,
) => {
  const table =
    sourceType === "start_journey_submission"
      ? "start_journey_submissions"
      : "contact_requests";
  const { data, error } = await (supabase as any)
    .from(table)
    .select("id, patient_id, request_type")
    .eq("id", sourceId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to verify journey source.", error.message);
  }

  if (!data) {
    throw new ApiError(404, "Journey source not found");
  }

  if (
    sourceType === "consultation_request" &&
    (data as Record<string, unknown>).request_type !== "consultation"
  ) {
    throw new ApiError(400, "Source is not a consultation request.");
  }

  return ((data as Record<string, string | null>).patient_id ?? null) as
    | string
    | null;
};

const isManager = (auth?: AuthorizationContext) =>
  auth?.hasPermission("operations.patient_journeys.manage") ?? false;

const canReadJourney = (auth?: AuthorizationContext) =>
  auth?.hasPermission("operations.patient_journeys.read") ?? false;

const canUpdateAssignedStep = (auth?: AuthorizationContext) =>
  auth?.hasPermission("operations.patient_journey_steps.update_assigned") ??
  false;

const requireManager = (auth?: AuthorizationContext) => {
  if (!isManager(auth)) {
    throw new ApiError(403, "Patient journey manage permission is required.");
  }
};

const requireReadableJourney = (
  journey: PatientJourney | null,
  auth?: AuthorizationContext,
) => {
  if (!journey) {
    throw new ApiError(404, "Patient journey not found");
  }

  if (isManager(auth)) {
    return;
  }

  if (
    auth?.profileId &&
    canReadJourney(auth) &&
    journey.assigned_coordinator_profile_id === auth.profileId
  ) {
    return;
  }

  throw new ApiError(403, "Patient journey access denied.");
};

const sortNestedRows = (journey: PatientJourney): PatientJourney => ({
  ...journey,
  steps: [...(journey.steps ?? [])].sort((a, b) => a.position - b.position),
  sources: [...(journey.sources ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  ),
});

const unique = (values: string[]) => [...new Set(values)];

const countDocuments = (value: unknown) =>
  Array.isArray(value) ? value.length : 0;

const fullName = (firstName?: string | null, lastName?: string | null) => {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name.length > 0 ? name : null;
};

const makeMissingIntakeSource = (
  source: PatientJourneySource,
): PatientJourneyIntakeSource => ({
  ...source,
  source_created_at: null,
  status: null,
  origin: null,
  patient_id: null,
  full_name: null,
  email: null,
  phone: null,
  country: null,
  treatment: null,
  procedure: null,
  medical_context: null,
  message: null,
  budget_range: null,
  travel_window: null,
  companions: null,
  contact_preference: null,
  documents_count: 0,
  notes: null,
  missing_source: true,
});

const normalizeContactSource = (
  source: PatientJourneySource,
  row: Record<string, any> | undefined,
): PatientJourneyIntakeSource => {
  if (!row) {
    return makeMissingIntakeSource(source);
  }

  return {
    ...source,
    source_created_at: row.created_at ?? null,
    status: row.status ?? null,
    origin: row.origin ?? null,
    patient_id: row.patient_id ?? null,
    full_name: fullName(row.first_name, row.last_name),
    email: row.email ?? null,
    phone: row.phone ?? null,
    country: row.country ?? null,
    treatment: row.treatment ?? null,
    procedure: null,
    medical_context: row.health_background ?? row.medical_reports ?? null,
    message: row.message ?? null,
    budget_range: row.budget_range ?? null,
    travel_window: row.travel_window ?? null,
    companions: row.companions ?? null,
    contact_preference: row.contact_preference ?? null,
    documents_count: countDocuments(row.documents),
    notes: row.notes ?? null,
    missing_source: false,
  };
};

const normalizeStartJourneySource = (
  source: PatientJourneySource,
  row: Record<string, any> | undefined,
): PatientJourneyIntakeSource => {
  if (!row) {
    return makeMissingIntakeSource(source);
  }

  return {
    ...source,
    source_created_at: row.created_at ?? null,
    status: row.status ?? null,
    origin: row.origin ?? null,
    patient_id: row.patient_id ?? null,
    full_name: fullName(row.first_name, row.last_name),
    email: row.email ?? null,
    phone: row.phone ?? null,
    country: row.country ?? null,
    treatment: row.treatment_name ?? null,
    procedure: row.procedure_name ?? null,
    medical_context: row.medical_condition ?? null,
    message: row.previous_treatments ?? null,
    budget_range: row.budget_range ?? null,
    travel_window: row.timeline ?? null,
    companions: row.companion_travelers ?? null,
    contact_preference:
      row.consultation_mode ?? row.language_preference ?? null,
    documents_count: countDocuments(row.documents),
    notes: row.notes ?? null,
    missing_source: false,
  };
};

const hydrateIntakeSources = async (
  journeys: PatientJourney[],
): Promise<PatientJourney[]> => {
  const allSources = journeys.flatMap((journey) => journey.sources ?? []);
  if (allSources.length === 0) {
    return journeys.map((journey) => ({ ...journey, intake_sources: [] }));
  }

  const contactIds = unique(
    allSources
      .filter((source) =>
        ["contact_request", "consultation_request"].includes(
          source.source_type,
        ),
      )
      .map((source) => source.source_id),
  );
  const startJourneyIds = unique(
    allSources
      .filter((source) => source.source_type === "start_journey_submission")
      .map((source) => source.source_id),
  );

  const supabase = getSupabaseAdmin() as any;
  const [contactResult, startJourneyResult] = await Promise.all([
    contactIds.length > 0
      ? supabase
          .from("contact_requests")
          .select(
            `
              id,
              first_name,
              last_name,
              email,
              phone,
              country,
              treatment,
              health_background,
              message,
              status,
              request_type,
              origin,
              patient_id,
              budget_range,
              travel_window,
              companions,
              medical_reports,
              contact_preference,
              documents,
              notes,
              created_at
            `,
          )
          .in("id", contactIds)
      : Promise.resolve({ data: [], error: null }),
    startJourneyIds.length > 0
      ? supabase
          .from("start_journey_submissions")
          .select(
            `
              id,
              first_name,
              last_name,
              email,
              phone,
              country,
              treatment_name,
              procedure_name,
              medical_condition,
              previous_treatments,
              status,
              origin,
              patient_id,
              budget_range,
              timeline,
              companion_travelers,
              consultation_mode,
              language_preference,
              documents,
              notes,
              created_at
            `,
          )
          .in("id", startJourneyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contactResult.error || startJourneyResult.error) {
    throw new ApiError(
      500,
      "Failed to hydrate journey intake sources",
      contactResult.error?.message ?? startJourneyResult.error?.message,
    );
  }

  const contactById = new Map<string, Record<string, any>>(
    ((contactResult.data ?? []) as Record<string, any>[]).map((row) => [
      row.id,
      row,
    ]),
  );
  const startJourneyById = new Map<string, Record<string, any>>(
    ((startJourneyResult.data ?? []) as Record<string, any>[]).map((row) => [
      row.id,
      row,
    ]),
  );

  return journeys.map((journey) => ({
    ...journey,
    intake_sources: (journey.sources ?? []).map((source) =>
      source.source_type === "start_journey_submission"
        ? normalizeStartJourneySource(
            source,
            startJourneyById.get(source.source_id),
          )
        : normalizeContactSource(source, contactById.get(source.source_id)),
    ),
  }));
};

const withIntakeSources = async (
  journeys: PatientJourney[],
): Promise<PatientJourney[]> => {
  try {
    return await hydrateIntakeSources(journeys);
  } catch (error) {
    console.warn("[patient-journeys] failed to hydrate intake sources", error);
    return journeys;
  }
};

export const patientJourneyController = {
  async list(filters: unknown, auth?: AuthorizationContext) {
    const parsed = listFiltersSchema.parse(filters ?? {});
    const supabase = getSupabaseAdmin() as any;

    let query = supabase
      .from("patient_journeys")
      .select(JOURNEY_SELECT)
      .order("created_at", { ascending: false });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.patientId) {
      query = query.eq("patient_id", parsed.patientId);
    }

    if (isManager(auth)) {
      if (parsed.assignedTo !== undefined) {
        if (parsed.assignedTo === null) {
          query = query.is("assigned_coordinator_profile_id", null);
        } else {
          query = query.eq(
            "assigned_coordinator_profile_id",
            parsed.assignedTo,
          );
        }
      }
    } else {
      if (!auth?.profileId) {
        return [];
      }
      query = query.eq("assigned_coordinator_profile_id", auth.profileId);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, "Failed to load patient journeys", error.message);
    }

    return withIntakeSources(
      ((data ?? []) as PatientJourney[]).map(sortNestedRows),
    );
  },

  async get(id: unknown, auth?: AuthorizationContext) {
    const journeyId = uuidSchema.parse(id);
    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from("patient_journeys")
      .select(JOURNEY_SELECT)
      .eq("id", journeyId)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to load patient journey", error.message);
    }

    const journey = data ? sortNestedRows(data as PatientJourney) : null;
    requireReadableJourney(journey, auth);
    const [hydratedJourney] = await withIntakeSources([journey]);
    return hydratedJourney;
  },

  async start(payload: unknown, auth?: AuthorizationContext) {
    requireManager(auth);
    const parsed = startJourneySchema.parse(payload);
    const supabase = getSupabaseAdmin() as any;
    await validateAssignableCoordinator(supabase, parsed.coordinatorProfileId);

    const { data: existingSource, error: existingSourceError } = await supabase
      .from("patient_journey_sources")
      .select("journey_id")
      .eq("source_type", parsed.sourceType)
      .eq("source_id", parsed.sourceId)
      .maybeSingle();

    if (existingSourceError) {
      throw new ApiError(
        500,
        "Failed to verify journey source link.",
        existingSourceError.message,
      );
    }

    if (existingSource?.journey_id) {
      return this.get(existingSource.journey_id, auth);
    }

    const sourcePatientId = await loadSourcePatientId(
      supabase,
      parsed.sourceType,
      parsed.sourceId,
    );

    if (
      sourcePatientId &&
      parsed.patientId &&
      sourcePatientId !== parsed.patientId
    ) {
      throw new ApiError(
        400,
        "Journey source is already linked to a different patient.",
      );
    }

    const { data, error } = await supabase.rpc(
      "start_patient_journey_from_source",
      {
        p_source_type: parsed.sourceType,
        p_source_id: parsed.sourceId,
        p_patient_id: parsed.patientId ?? null,
        p_coordinator_profile_id: parsed.coordinatorProfileId,
        p_actor_profile_id: auth?.profileId ?? null,
      },
    );

    if (error) {
      throw new ApiError(500, "Failed to start patient journey", error.message);
    }

    const createdJourney = data as PatientJourney | null;
    const journeyId = createdJourney?.id;
    if (!journeyId) {
      throw new ApiError(
        500,
        "Failed to start patient journey",
        "Supabase did not return the journey id.",
      );
    }

    try {
      return await this.get(journeyId, auth);
    } catch (error) {
      // Starting the journey succeeded. If the follow-up enriched read fails
      // because PostgREST has not refreshed relationship metadata yet, still
      // return the journey row so callers can route to the new workspace.
      if (error instanceof ApiError && error.status >= 500) {
        return createdJourney;
      }
      throw error;
    }
  },

  async update(id: unknown, payload: unknown, auth?: AuthorizationContext) {
    requireManager(auth);
    const journeyId = uuidSchema.parse(id);
    const parsed = updateJourneySchema.parse(payload);
    const supabase = getSupabaseAdmin() as any;
    const currentJourney = await this.get(journeyId, auth);
    const updatePayload: Record<string, unknown> = {
      updated_by_profile_id: auth?.profileId ?? null,
    };

    if (currentJourney.status !== "active") {
      throw new ApiError(
        409,
        `Cannot update a ${currentJourney.status} patient journey.`,
      );
    }

    if (parsed.status === "completed") {
      const incompleteStep = (currentJourney.steps ?? []).find(
        (step) => step.status !== "completed",
      );
      if (incompleteStep) {
        throw new ApiError(
          400,
          "Complete every journey step before marking the journey completed.",
        );
      }
    }

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
      updatePayload.completed_at =
        parsed.status === "completed" ? new Date().toISOString() : null;
      updatePayload.cancelled_at =
        parsed.status === "cancelled" ? new Date().toISOString() : null;
    }

    if (parsed.account_manager_profile_id !== undefined) {
      await validateAssignableAccountManager(
        supabase,
        parsed.account_manager_profile_id,
      );
      updatePayload.account_manager_profile_id =
        parsed.account_manager_profile_id ?? null;
    }

    if (parsed.assigned_coordinator_profile_id !== undefined) {
      await validateAssignableCoordinator(
        supabase,
        parsed.assigned_coordinator_profile_id,
      );
      updatePayload.assigned_coordinator_profile_id =
        parsed.assigned_coordinator_profile_id ?? null;
    }

    const { error } = await supabase
      .from("patient_journeys")
      .update(updatePayload)
      .eq("id", journeyId);

    if (error) {
      throw new ApiError(
        500,
        "Failed to update patient journey",
        error.message,
      );
    }

    return this.get(journeyId, auth);
  },

  async updateStep(
    journeyIdInput: unknown,
    stepIdInput: unknown,
    payload: unknown,
    auth?: AuthorizationContext,
  ) {
    const journeyId = uuidSchema.parse(journeyIdInput);
    const stepId = uuidSchema.parse(stepIdInput);
    const parsed = updateStepSchema.parse(payload);
    const journey = await this.get(journeyId, auth);
    const manager = isManager(auth);
    assertActiveJourney(journey, "update steps on");

    if (!manager) {
      if (!canUpdateAssignedStep(auth)) {
        throw new ApiError(
          403,
          "Assigned journey step update permission is required.",
        );
      }
      const allowedKeys = new Set(["status", "coordinator_notes"]);
      const disallowed = Object.keys(parsed).filter(
        (key) => !allowedKeys.has(key),
      );
      if (disallowed.length > 0) {
        throw new ApiError(
          403,
          "Coordinators can update only step status and coordinator notes.",
        );
      }
    }

    const existingStep = (journey.steps ?? []).find(
      (step) => step.id === stepId,
    );

    if (!existingStep) {
      throw new ApiError(404, "Patient journey step not found");
    }

    const updatePayload: Record<string, unknown> = {
      updated_by_profile_id: auth?.profileId ?? null,
    };

    if (manager) {
      if (parsed.title !== undefined) {
        updatePayload.title = parsed.title.trim();
      }
      if (parsed.description !== undefined) {
        updatePayload.description = normalizeText(parsed.description);
      }
      if (parsed.position !== undefined) {
        updatePayload.position = parsed.position;
      }
    }

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
      updatePayload.completed_at =
        parsed.status === "completed" ? new Date().toISOString() : null;
    }

    if (parsed.coordinator_notes !== undefined) {
      updatePayload.coordinator_notes = normalizeText(parsed.coordinator_notes);
    }

    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase.rpc(
      "update_patient_journey_step_guarded",
      {
        p_journey_id: journeyId,
        p_step_id: stepId,
        p_actor_profile_id: auth?.profileId ?? null,
        p_is_manager: manager,
        p_patch: updatePayload,
      },
    );

    if (error) {
      throw new ApiError(500, "Failed to update journey step", error.message);
    }

    return this.get(journeyId, auth);
  },

  async createStep(
    journeyIdInput: unknown,
    payload: unknown,
    auth?: AuthorizationContext,
  ) {
    requireManager(auth);
    const journeyId = uuidSchema.parse(journeyIdInput);
    const parsed = createStepSchema.parse(payload);
    const journey = await this.get(journeyId, auth);
    assertActiveJourney(journey, "add steps to");

    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase.rpc(
      "create_patient_journey_step_guarded",
      {
        p_journey_id: journeyId,
        p_title: parsed.title,
        p_description: normalizeText(parsed.description) ?? null,
        p_actor_profile_id: auth?.profileId ?? null,
      },
    );

    if (error) {
      throw new ApiError(500, "Failed to add journey step", error.message);
    }

    return this.get(journeyId, auth);
  },

  async reorderSteps(
    journeyIdInput: unknown,
    payload: unknown,
    auth?: AuthorizationContext,
  ) {
    requireManager(auth);
    const journeyId = uuidSchema.parse(journeyIdInput);
    const parsed = reorderStepsSchema.parse(payload);
    const journey = await this.get(journeyId, auth);
    assertActiveJourney(journey, "reorder steps on");
    const existingSteps: PatientJourneyStep[] = journey.steps ?? [];
    const existingIds = new Set(existingSteps.map((step) => step.id));
    const orderedIds = parsed.orderedStepIds;
    const uniqueOrderedIds = new Set(orderedIds);

    if (
      orderedIds.length !== existingSteps.length ||
      uniqueOrderedIds.size !== orderedIds.length ||
      orderedIds.some((stepId) => !existingIds.has(stepId))
    ) {
      throw new ApiError(
        400,
        "Step order must include each current journey step exactly once.",
      );
    }

    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase.rpc(
      "reorder_patient_journey_steps_guarded",
      {
        p_journey_id: journeyId,
        p_ordered_step_ids: orderedIds,
        p_actor_profile_id: auth?.profileId ?? null,
      },
    );

    if (error) {
      throw new ApiError(500, "Failed to reorder journey steps", error.message);
    }

    return this.get(journeyId, auth);
  },
};
