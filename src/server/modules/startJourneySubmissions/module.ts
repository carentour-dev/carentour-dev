import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database, Json } from "@/integrations/supabase/types";

const STATUS_VALUES = [
  "new",
  "reviewing",
  "contacted",
  "consultation_scheduled",
  "completed",
  "archived",
] as const;
const statusSchema = z.enum(STATUS_VALUES);
const ORIGIN_VALUES = ["web", "portal"] as const;
const originSchema = z.enum(ORIGIN_VALUES).optional();

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const createStartJourneySubmissionSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.string().optional(),
  country: z.string().min(1),
  treatment_id: z.string().uuid().optional(),
  treatment_name: z.string().optional(),
  procedure_id: z.string().uuid().optional(),
  procedure_name: z.string().optional(),
  timeline: z.string().optional(),
  budget_range: z.string().optional(),
  medical_condition: z.string().min(1),
  previous_treatments: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  doctor_preference: z.string().optional(),
  accessibility_needs: z.string().optional(),
  travel_dates: jsonSchema.optional(),
  accommodation_type: z.string().optional(),
  companion_travelers: z.string().optional(),
  dietary_requirements: z.string().optional(),
  language_preference: z.string().optional(),
  language_notes: z.string().optional(),
  has_insurance: z.boolean().optional(),
  has_passport: z.boolean().optional(),
  has_medical_records: z.boolean().optional(),
  documents: jsonSchema.optional(),
  consultation_mode: z.string().optional(),
  user_id: optionalUuid,
  patient_id: optionalUuid,
  origin: originSchema,
  status: statusSchema.optional(),
});

const updateStartJourneySubmissionSchema = z
  .object({
    status: statusSchema.optional(),
    notes: z.string().optional(),
    assigned_to: optionalUuid,
    patient_id: optionalUuid,
    consultation_id: optionalUuid,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  assignedTo: optionalUuid,
});

const submissionIdSchema = z.string().uuid();

type StartJourneySubmissionInsert =
  Database["public"]["Tables"]["start_journey_submissions"]["Insert"];
type StartJourneySubmissionUpdate =
  Database["public"]["Tables"]["start_journey_submissions"]["Update"];
export type StartJourneySubmissionStatus =
  Database["public"]["Enums"]["journey_submission_status"];

const startJourneySubmissionService = new CrudService(
  "start_journey_submissions",
  "start journey submission",
);

const trim = (value: string) => value.trim();

const trimOptional = (value: string | undefined): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeOrigin = (
  origin?: string | null,
  hasUser = false,
): StartJourneySubmissionInsert["origin"] => {
  if (
    origin &&
    ORIGIN_VALUES.includes(origin as (typeof ORIGIN_VALUES)[number])
  ) {
    return origin as StartJourneySubmissionInsert["origin"];
  }
  return hasUser ? "portal" : "web";
};

export const START_JOURNEY_SUBMISSION_STATUSES = STATUS_VALUES;

export const startJourneySubmissionController = {
  async list(filters: { status?: StartJourneySubmissionStatus } = {}) {
    const parsed = listFiltersSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("start_journey_submissions")
      .select(
        `
          *,
          assigned_profile:profiles!start_journey_submissions_assigned_to_fkey(
            id,
            username,
            avatar_url,
            email,
            job_title
          ),
          assigned_secure_profile:secure_profiles!start_journey_submissions_assigned_to_fkey(
            id,
            username,
            email,
            avatar_url
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.assignedTo !== undefined) {
      if (parsed.assignedTo === null) {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", parsed.assignedTo);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(
        500,
        "Failed to load start journey submissions",
        error.message,
      );
    }

    return (data ??
      []) as Database["public"]["Tables"]["start_journey_submissions"]["Row"][];
  },

  async get(id: unknown) {
    const submissionId = submissionIdSchema.parse(id);
    return startJourneySubmissionService.getById(submissionId);
  },

  async create(payload: unknown) {
    const parsed = createStartJourneySubmissionSchema.parse(payload);

    const insertPayload: StartJourneySubmissionInsert = {
      first_name: trim(parsed.first_name),
      last_name: trim(parsed.last_name),
      email: trim(parsed.email).toLowerCase(),
      phone: trim(parsed.phone),
      age: trimOptional(parsed.age),
      country: trim(parsed.country),
      treatment_id: parsed.treatment_id ?? null,
      treatment_name: trimOptional(parsed.treatment_name),
      procedure_id: parsed.procedure_id ?? null,
      procedure_name: trimOptional(parsed.procedure_name),
      timeline: trimOptional(parsed.timeline),
      budget_range: trimOptional(parsed.budget_range),
      medical_condition: trim(parsed.medical_condition),
      previous_treatments: trimOptional(parsed.previous_treatments),
      current_medications: trimOptional(parsed.current_medications),
      allergies: trimOptional(parsed.allergies),
      doctor_preference: trimOptional(parsed.doctor_preference),
      accessibility_needs: trimOptional(parsed.accessibility_needs),
      travel_dates: parsed.travel_dates ?? null,
      accommodation_type: trimOptional(parsed.accommodation_type),
      companion_travelers: trimOptional(parsed.companion_travelers),
      dietary_requirements: trimOptional(parsed.dietary_requirements),
      language_preference: trimOptional(parsed.language_preference),
      language_notes: trimOptional(parsed.language_notes),
      has_insurance: parsed.has_insurance ?? false,
      has_passport: parsed.has_passport ?? false,
      has_medical_records: parsed.has_medical_records ?? false,
      documents: parsed.documents ?? null,
      consultation_mode: trimOptional(parsed.consultation_mode),
      user_id: parsed.user_id ?? null,
      patient_id: parsed.patient_id ?? null,
      origin: sanitizeOrigin(parsed.origin, parsed.user_id != null),
      status: parsed.status ?? "new",
    };

    if (insertPayload.status === "completed") {
      insertPayload.resolved_at = new Date().toISOString();
    }

    return startJourneySubmissionService.create(insertPayload);
  },

  async update(id: unknown, payload: unknown) {
    const submissionId = submissionIdSchema.parse(id);
    const parsed = updateStartJourneySubmissionSchema.parse(payload);

    const updatePayload: StartJourneySubmissionUpdate = {};

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
      updatePayload.resolved_at =
        parsed.status === "completed" ? new Date().toISOString() : null;
    }

    if (parsed.notes !== undefined) {
      updatePayload.notes = trimOptional(parsed.notes);
    }

    if (parsed.assigned_to !== undefined) {
      updatePayload.assigned_to = parsed.assigned_to ?? null;
    }

    if (parsed.patient_id !== undefined) {
      updatePayload.patient_id = parsed.patient_id ?? null;
    }

    if (parsed.consultation_id !== undefined) {
      updatePayload.consultation_id = parsed.consultation_id ?? null;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return startJourneySubmissionService.update(submissionId, updatePayload);
  },

  async delete(id: unknown) {
    const submissionId = submissionIdSchema.parse(id);
    return startJourneySubmissionService.remove(submissionId);
  },
};
