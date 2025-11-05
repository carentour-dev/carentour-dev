import { randomUUID } from "crypto";
import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { AuthorizationContext } from "@/server/auth/requireAdmin";
import type { Database } from "@/integrations/supabase/types";
import {
  PatientStatusEnum,
  PatientSourceEnum,
  PatientCreationChannelEnum,
  type PatientStatus,
  type PatientSource,
  type PatientCreationChannel,
} from "@/lib/patients/status";

// Patients share the generic CRUD helpers used by other admin modules.
const patientServiceInstance = new CrudService("patients", "patient");

const CONFIRM_PATIENT_PERMISSION = "operations.patients.confirm";

const isoDate = z
  .string()
  .regex(/^(\d{4})-(\d{2})-(\d{2})$/)
  .optional();

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const createPatientSchema = z.object({
  user_id: optionalUuid,
  full_name: z.string().min(2),
  date_of_birth: isoDate,
  sex: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional(),
  contact_email: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0
          ? undefined
          : value,
      z.string().email().optional(),
    )
    .optional(),
  contact_phone: z.string().optional(),
  preferred_language: z.string().optional(),
  preferred_currency: z.string().optional(),
  notes: z.string().optional(),
  email_verified: z.boolean().optional(),
  portal_password: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0
          ? undefined
          : value,
      z.string().min(8).max(72).optional(),
    )
    .optional(),
  status: PatientStatusEnum.optional(),
  source: PatientSourceEnum.optional(),
  created_channel: PatientCreationChannelEnum.optional(),
  created_by_profile_id: optionalUuid,
});

const updatePatientSchema = createPatientSchema.partial();
const patientIdSchema = z.string().uuid();

export const patientService = patientServiceInstance;

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type ProfileSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "username" | "email" | "avatar_url" | "phone" | "job_title"
>;
type ContactRequestRow =
  Database["public"]["Tables"]["contact_requests"]["Row"];
type StartJourneySubmissionRow =
  Database["public"]["Tables"]["start_journey_submissions"]["Row"];
type ConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"];
type AppointmentRow =
  Database["public"]["Tables"]["patient_appointments"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];
type DoctorReviewRow = Database["public"]["Tables"]["doctor_reviews"]["Row"];
type PatientStoryRow = Database["public"]["Tables"]["patient_stories"]["Row"];
type StartJourneyDocumentRecord = {
  id?: string;
  type?: string;
  originalName?: string;
  storedName?: string;
  path?: string;
  bucket?: string;
  size?: number;
  url?: string | null;
  uploadedAt?: string;
};

type ContactRequestDetail = ContactRequestRow & {
  assigned_profile?: ProfileSummary | null;
};

type StartJourneySubmissionDetail = StartJourneySubmissionRow & {
  assigned_profile?: ProfileSummary | null;
};

type ConsultationDetail = ConsultationRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  contact_requests?: Pick<
    ContactRequestRow,
    "id" | "status" | "request_type" | "origin"
  > | null;
  coordinator_profile?: ProfileSummary | null;
};

type AppointmentDetail = AppointmentRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  service_provider?: Pick<
    ServiceProviderRow,
    "id" | "name" | "facility_type"
  > | null;
  patient_consultations?: Pick<
    ConsultationRow,
    "id" | "scheduled_at" | "status"
  > | null;
};

type ReviewDetail = DoctorReviewRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  treatments?: Pick<TreatmentRow, "id" | "name" | "slug"> | null;
};

type StoryDetail = PatientStoryRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  treatments?: Pick<TreatmentRow, "id" | "name" | "slug"> | null;
};

export type PatientDocumentSummary = {
  id: string;
  source: "start_journey" | "storage";
  label: string;
  type: string | null;
  uploaded_at: string | null;
  request_id?: string | null;
  bucket?: string | null;
  path?: string | null;
  size?: number | null;
  signed_url?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type PatientDetails = {
  patient: PatientRow & {
    creator_profile: ProfileSummary | null;
    confirmed_by_profile: ProfileSummary | null;
    portal_profile: ProfileSummary | null;
    auth_user: {
      id: string;
      email: string | null;
      created_at: string | null;
      last_sign_in_at: string | null;
    } | null;
  };
  contact_requests: ContactRequestDetail[];
  start_journey_submissions: StartJourneySubmissionDetail[];
  consultations: ConsultationDetail[];
  appointments: AppointmentDetail[];
  reviews: ReviewDetail[];
  stories: StoryDetail[];
  documents: PatientDocumentSummary[];
};

const trimString = (value: string) => value.trim();

const trimOptionalString = (value: string | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptionalEmail = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

const ACCOUNT_ALREADY_EXISTS = /already registered/i;

const normalizeProfileField = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const OPERATIONS_PRIMARY_ROLES = new Set(["coordinator", "employee"]);

const resolvePatientSource = (
  requested: PatientSource | undefined,
  createdByProfileId: string | null,
): PatientSource => {
  if (requested) {
    return requested;
  }
  return createdByProfileId ? "staff" : "organic";
};

const resolveCreatedChannel = (
  requested: PatientCreationChannel | undefined,
  auth?: AuthorizationContext,
): PatientCreationChannel => {
  if (requested) {
    return requested;
  }
  if (!auth?.profileId) {
    return "portal_signup";
  }
  if (
    auth.primaryRole &&
    OPERATIONS_PRIMARY_ROLES.has(auth.primaryRole.toLowerCase())
  ) {
    return "operations_dashboard";
  }
  return "admin_console";
};

const PATIENT_DOCUMENT_BUCKET = "patient-documents";

const dedupeById = <T extends { id: string }>(rows: T[]): T[] => {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
};

const CONTACT_REQUEST_SELECT = `
  id,
  user_id,
  patient_id,
  first_name,
  last_name,
  email,
  phone,
  country,
  treatment,
  message,
  status,
  request_type,
  origin,
  notes,
  travel_window,
  health_background,
  budget_range,
  companions,
  assigned_to,
  portal_metadata,
  medical_reports,
  resolved_at,
  created_at,
  updated_at,
  assigned_profile:profiles!contact_requests_assigned_to_fkey(
    id,
    username,
    email,
    avatar_url,
    phone,
    job_title
  )
`;

const START_JOURNEY_SELECT = `
  *,
  assigned_profile:profiles!start_journey_submissions_assigned_to_fkey(
    id,
    username,
    email,
    avatar_url,
    phone,
    job_title
  )
`;

const CONSULTATION_SELECT = `
  *,
  doctors:doctors!patient_consultations_doctor_id_fkey(
    id,
    name,
    title,
    avatar_url
  ),
  contact_requests:contact_requests!patient_consultations_contact_request_id_fkey(
    id,
    status,
    request_type,
    origin
  ),
  coordinator_profile:profiles!patient_consultations_coordinator_id_fkey(
    id,
    username,
    email,
    avatar_url,
    phone,
    job_title
  )
`;

const APPOINTMENT_SELECT = `
  *,
  doctors:doctors!patient_appointments_doctor_id_fkey(
    id,
    name,
    title,
    avatar_url
  ),
  service_provider:service_providers!patient_appointments_facility_id_fkey(
    id,
    name,
    facility_type
  ),
  patient_consultations:patient_consultations!patient_appointments_consultation_id_fkey(
    id,
    scheduled_at,
    status
  )
`;

const REVIEW_SELECT = `
  *,
  doctors:doctors!doctor_reviews_doctor_id_fkey(
    id,
    name,
    title,
    avatar_url
  ),
  treatments:treatments!doctor_reviews_treatment_id_fkey(
    id,
    name,
    slug
  )
`;

const STORY_SELECT = `
  *,
  doctors:doctors!patient_stories_doctor_id_fkey(
    id,
    name,
    title,
    avatar_url
  ),
  treatments:treatments!patient_stories_treatment_id_fkey(
    id,
    name,
    slug
  )
`;

const syncProfileWithPatient = async (
  supabase: SupabaseAdminClient,
  {
    userId,
    fullName,
    dateOfBirth,
    sex,
    nationality,
    phone,
  }: {
    userId: string | null | undefined;
    fullName?: string | null;
    dateOfBirth?: string | null;
    sex?: string | null;
    nationality?: string | null;
    phone?: string | null;
  },
) => {
  if (!userId) return;

  const updatePayload: Record<string, unknown> = {};

  const normalizedFullName = normalizeProfileField(fullName);
  if (normalizedFullName !== undefined) {
    updatePayload.username = normalizedFullName;
  }

  const normalizedDob = normalizeProfileField(dateOfBirth);
  if (normalizedDob !== undefined) {
    updatePayload.date_of_birth = normalizedDob;
  }

  const normalizedSex = normalizeProfileField(sex);
  if (normalizedSex !== undefined) {
    updatePayload.sex = normalizedSex;
  }

  const normalizedNationality = normalizeProfileField(nationality);
  if (normalizedNationality !== undefined) {
    updatePayload.nationality = normalizedNationality;
  }

  const normalizedPhone = normalizeProfileField(phone);
  if (normalizedPhone !== undefined) {
    updatePayload.phone = normalizedPhone;
  }

  if (Object.keys(updatePayload).length === 0) {
    return;
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (updateError && updateError.code !== "PGRST116") {
    throw new ApiError(
      500,
      "Failed to synchronize patient profile details.",
      updateError.message,
    );
  }

  if (updatedProfile) {
    return;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    ...updatePayload,
  });

  if (insertError) {
    if (insertError.code === "23505" || insertError.code === "409") {
      const { error: retryError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", userId);

      if (retryError) {
        throw new ApiError(
          500,
          "Failed to synchronize patient profile details.",
          retryError.message,
        );
      }
      return;
    }

    throw new ApiError(
      500,
      "Failed to synchronize patient profile details.",
      insertError.message,
    );
  }
};

const createOrUpdatePortalAccount = async (
  supabase: SupabaseAdminClient,
  {
    email,
    password,
    fullName,
    emailVerified,
  }: {
    email: string;
    password: string;
    fullName: string;
    emailVerified: boolean;
  },
): Promise<{ userId: string; createdNew: boolean }> => {
  const metadata = fullName.length > 0 ? { full_name: fullName } : undefined;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: emailVerified,
    user_metadata: metadata,
  });

  if (!error) {
    const userId = data?.user?.id;
    if (!userId) {
      throw new ApiError(
        500,
        "Supabase did not return an identifier for the new portal user.",
      );
    }
    return { userId, createdNew: true };
  }

  if (error.message && ACCOUNT_ALREADY_EXISTS.test(error.message)) {
    const { data: lookupData, error: lookupError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
      });

    if (lookupError || !lookupData?.user) {
      throw new ApiError(
        400,
        "An account already exists for this email address. Update it manually from Supabase Auth.",
        lookupError?.message,
      );
    }

    const userId = lookupData.user.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password,
        email,
        email_confirm: emailVerified,
        user_metadata: metadata,
      },
    );

    if (updateError) {
      throw new ApiError(
        500,
        "Failed to update the existing patient portal account.",
        updateError.message,
      );
    }

    return { userId, createdNew: false };
  }

  throw new ApiError(
    500,
    "Failed to create patient portal account.",
    error.message,
  );
};

const sendPortalPasswordEmail = async (
  supabase: SupabaseAdminClient,
  {
    email,
    fullName,
    password,
  }: { email: string; fullName: string; password: string },
) => {
  const fallbackName =
    fullName.trim().length > 0
      ? fullName
      : (email.split("@")[0] ?? "Care N Tour Patient");
  const { error } = await supabase.functions.invoke("send-welcome-email", {
    body: {
      email,
      username: fallbackName,
      password,
    },
  });

  if (error) {
    const message =
      typeof error === "string"
        ? error
        : (error.message ?? "Unknown email service error.");
    throw new ApiError(
      500,
      "Failed to send portal credentials email to the patient.",
      message,
    );
  }
};

export const patientController = {
  async list(options?: { status?: PatientStatus }) {
    const supabase = getSupabaseAdmin();
    const query = supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await (options?.status
      ? (query as any).eq("status", options.status)
      : query);

    if (error) {
      throw new ApiError(500, "Failed to fetch patient list", error.message);
    }

    return data ?? [];
  },

  async search(query: string, options?: { status?: PatientStatus }) {
    const supabase = getSupabaseAdmin();
    const searchTerm = `%${query.trim()}%`;

    const request = supabase
      .from("patients")
      .select(
        "id, full_name, contact_email, nationality, home_city, has_testimonial, status",
      )
      .or(`full_name.ilike.${searchTerm},contact_email.ilike.${searchTerm}`)
      .order("full_name", { ascending: true })
      .limit(20);

    const { data, error } = await (options?.status
      ? (request as any).eq("status", options.status)
      : request);

    if (error) {
      throw new ApiError(500, "Failed to search patients", error.message);
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.getById(patientId);
  },

  async details(id: unknown): Promise<PatientDetails> {
    const patientId = patientIdSchema.parse(id);
    const supabase = getSupabaseAdmin();

    const { data: patientRow, error: patientError } = await supabase
      .from("patients")
      .select(
        `
          *,
          creator_profile:profiles!patients_created_by_profile_id_fkey(
            id,
            username,
            email,
            avatar_url,
            phone,
            job_title
          ),
          confirmed_by_profile:profiles!patients_confirmed_by_fkey(
            id,
            username,
            email,
            avatar_url,
            phone,
            job_title
          )
        `,
      )
      .eq("id", patientId)
      .maybeSingle();

    if (patientError) {
      throw new ApiError(
        500,
        "Failed to load patient record",
        patientError.message,
      );
    }

    if (!patientRow) {
      throw new ApiError(404, "Patient not found");
    }

    const patient = patientRow as PatientRow & {
      creator_profile: ProfileSummary | null;
      confirmed_by_profile: ProfileSummary | null;
    };

    const contactQueries = [
      supabase
        .from("contact_requests")
        .select(CONTACT_REQUEST_SELECT)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ];

    if (patient.user_id) {
      contactQueries.push(
        supabase
          .from("contact_requests")
          .select(CONTACT_REQUEST_SELECT)
          .eq("user_id", patient.user_id)
          .order("created_at", { ascending: false }),
      );
    }

    if (patient.contact_email) {
      contactQueries.push(
        supabase
          .from("contact_requests")
          .select(CONTACT_REQUEST_SELECT)
          .eq("email", patient.contact_email)
          .order("created_at", { ascending: false }),
      );
    }

    const contactAccumulator: ContactRequestDetail[] = [];

    for (const query of contactQueries) {
      const { data, error } = await query;
      if (error) {
        throw new ApiError(
          500,
          "Failed to load contact requests",
          error.message,
        );
      }
      if (Array.isArray(data)) {
        contactAccumulator.push(...(data as ContactRequestDetail[]));
      }
    }

    const startJourneyQueries = [
      supabase
        .from("start_journey_submissions")
        .select(START_JOURNEY_SELECT)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ];

    if (patient.user_id) {
      startJourneyQueries.push(
        supabase
          .from("start_journey_submissions")
          .select(START_JOURNEY_SELECT)
          .eq("user_id", patient.user_id)
          .order("created_at", { ascending: false }),
      );
    }

    const startJourneyAccumulator: StartJourneySubmissionDetail[] = [];

    for (const query of startJourneyQueries) {
      const { data, error } = await query;
      if (error) {
        throw new ApiError(
          500,
          "Failed to load Start Journey submissions",
          error.message,
        );
      }
      if (Array.isArray(data)) {
        startJourneyAccumulator.push(
          ...(data as StartJourneySubmissionDetail[]),
        );
      }
    }

    const [
      consultationsResult,
      appointmentsResult,
      reviewsResult,
      storiesResult,
    ] = await Promise.all([
      supabase
        .from("patient_consultations")
        .select(CONSULTATION_SELECT)
        .eq("patient_id", patientId)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("patient_appointments")
        .select(APPOINTMENT_SELECT)
        .eq("patient_id", patientId)
        .order("starts_at", { ascending: true }),
      supabase
        .from("doctor_reviews")
        .select(REVIEW_SELECT)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_stories")
        .select(STORY_SELECT)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ]);

    if (consultationsResult.error) {
      throw new ApiError(
        500,
        "Failed to load consultations",
        consultationsResult.error.message,
      );
    }

    if (appointmentsResult.error) {
      throw new ApiError(
        500,
        "Failed to load appointments",
        appointmentsResult.error.message,
      );
    }

    if (reviewsResult.error) {
      throw new ApiError(
        500,
        "Failed to load doctor reviews",
        reviewsResult.error.message,
      );
    }

    if (storiesResult.error) {
      throw new ApiError(
        500,
        "Failed to load patient stories",
        storiesResult.error.message,
      );
    }

    let portalProfile: ProfileSummary | null = null;

    if (patient.user_id) {
      const { data: portalProfileData, error: portalProfileError } =
        await supabase
          .from("profiles")
          .select("id, username, email, avatar_url, phone, job_title")
          .eq("user_id", patient.user_id)
          .maybeSingle();

      if (portalProfileError && portalProfileError.code !== "PGRST116") {
        throw new ApiError(
          500,
          "Failed to load patient portal profile",
          portalProfileError.message,
        );
      }

      portalProfile = (portalProfileData as ProfileSummary | null) ?? null;
    }

    let authUser: PatientDetails["patient"]["auth_user"] = null;

    if (patient.user_id) {
      const { data: authUserData, error: authUserError } =
        await supabase.auth.admin.getUserById(patient.user_id);

      if (!authUserError && authUserData?.user) {
        authUser = {
          id: authUserData.user.id,
          email: authUserData.user.email ?? null,
          created_at: authUserData.user.created_at ?? null,
          last_sign_in_at: authUserData.user.last_sign_in_at ?? null,
        };
      } else if (authUserError && authUserError.status !== 404) {
        throw new ApiError(
          500,
          "Failed to load linked portal user",
          authUserError.message,
        );
      }
    }

    const contactRequests = dedupeById(contactAccumulator);
    const startJourneySubmissions = dedupeById(startJourneyAccumulator);

    const documentsMap = new Map<string, PatientDocumentSummary>();

    for (const submission of startJourneySubmissions) {
      const rawDocuments = submission.documents;
      if (!rawDocuments) continue;

      const documentsArray = Array.isArray(rawDocuments)
        ? (rawDocuments as StartJourneyDocumentRecord[])
        : [];

      for (const raw of documentsArray) {
        if (!raw || typeof raw !== "object") {
          continue;
        }
        const path =
          typeof raw.path === "string" && raw.path.length > 0 ? raw.path : null;
        const docId =
          typeof raw.id === "string" && raw.id.length > 0
            ? raw.id
            : `${submission.id}-${path ?? randomUUID()}`;

        const label =
          typeof raw.originalName === "string" && raw.originalName.length > 0
            ? raw.originalName
            : (path ?? "Uploaded document");

        const document: PatientDocumentSummary = {
          id: docId,
          source: "start_journey",
          label,
          type:
            typeof raw.type === "string" && raw.type.length > 0
              ? raw.type
              : null,
          uploaded_at:
            typeof raw.uploadedAt === "string" && raw.uploadedAt.length > 0
              ? raw.uploadedAt
              : (submission.created_at ?? null),
          request_id: submission.id,
          bucket:
            typeof raw.bucket === "string" && raw.bucket.length > 0
              ? raw.bucket
              : PATIENT_DOCUMENT_BUCKET,
          path,
          size:
            typeof raw.size === "number" && Number.isFinite(raw.size)
              ? raw.size
              : null,
          signed_url:
            typeof raw.url === "string" && raw.url.length > 0 ? raw.url : null,
          metadata: {
            storedName:
              typeof raw.storedName === "string" && raw.storedName.length > 0
                ? raw.storedName
                : null,
          },
        };

        const key = path ?? docId;
        const existingDoc = documentsMap.get(key);
        if (existingDoc) {
          documentsMap.set(key, {
            ...existingDoc,
            request_id: existingDoc.request_id ?? document.request_id,
            size: existingDoc.size ?? document.size ?? null,
            signed_url: existingDoc.signed_url ?? document.signed_url ?? null,
            metadata: {
              ...(existingDoc.metadata ?? {}),
              ...(document.metadata ?? {}),
            },
          });
        } else {
          documentsMap.set(key, document);
        }
      }
    }

    try {
      const { data: storageEntries, error: storageError } =
        await supabase.storage
          .from(PATIENT_DOCUMENT_BUCKET)
          .list(`start-journey/${patient.id}`, {
            limit: 200,
            offset: 0,
            sortBy: { column: "created_at", order: "desc" },
          });

      if (!storageError && Array.isArray(storageEntries)) {
        for (const entry of storageEntries) {
          if (!entry || entry.id == null || entry.name.endsWith("/")) {
            continue;
          }

          const path = `start-journey/${patient.id}/${entry.name}`;
          const key = path;

          const document: PatientDocumentSummary = {
            id: entry.id,
            source: "storage",
            label: entry.name,
            type: null,
            uploaded_at: entry.created_at ?? entry.updated_at ?? null,
            bucket: PATIENT_DOCUMENT_BUCKET,
            path,
            size:
              typeof entry.metadata?.size === "number"
                ? entry.metadata.size
                : null,
            signed_url: null,
            metadata: entry.metadata ?? null,
          };

          const existingDoc = documentsMap.get(key);
          if (existingDoc) {
            documentsMap.set(key, {
              ...existingDoc,
              source: existingDoc.source ?? document.source,
              size: existingDoc.size ?? document.size ?? null,
              uploaded_at:
                existingDoc.uploaded_at ?? document.uploaded_at ?? null,
              metadata: {
                ...(existingDoc.metadata ?? {}),
                ...(document.metadata ?? {}),
              },
            });
          } else {
            documentsMap.set(key, document);
          }
        }
      }
    } catch (error) {
      console.error(
        "[patients][details] Failed to list storage documents",
        error,
      );
    }

    const documents = Array.from(documentsMap.values());

    const pathsNeedingSignedUrl = Array.from(
      new Set(
        documents
          .filter(
            (doc) =>
              doc.bucket === PATIENT_DOCUMENT_BUCKET &&
              doc.path &&
              !doc.signed_url,
          )
          .map((doc) => doc.path as string),
      ),
    );

    if (pathsNeedingSignedUrl.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(PATIENT_DOCUMENT_BUCKET)
        .createSignedUrls(pathsNeedingSignedUrl, 3600);

      if (!signedError && Array.isArray(signedData)) {
        const signedMap = new Map<string, string>();
        for (const entry of signedData) {
          if (entry?.path && entry.signedUrl) {
            signedMap.set(entry.path, entry.signedUrl);
          }
        }

        for (const doc of documents) {
          if (doc.path && signedMap.has(doc.path)) {
            doc.signed_url = signedMap.get(doc.path) ?? doc.signed_url ?? null;
          }
        }
      }
    }

    documents.sort((a, b) => {
      const aTime = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const bTime = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return bTime - aTime;
    });

    return {
      patient: {
        ...patient,
        portal_profile: portalProfile,
        auth_user: authUser,
      },
      contact_requests: contactRequests,
      start_journey_submissions: startJourneySubmissions,
      consultations: (consultationsResult.data ?? []) as ConsultationDetail[],
      appointments: (appointmentsResult.data ?? []) as AppointmentDetail[],
      reviews: (reviewsResult.data ?? []) as ReviewDetail[],
      stories: (storiesResult.data ?? []) as StoryDetail[],
      documents,
    };
  },

  async create(payload: unknown, auth?: AuthorizationContext) {
    const parsed = createPatientSchema.parse(payload);
    const supabase = getSupabaseAdmin();
    const trimmedFullName = trimString(parsed.full_name);
    const contactEmail = normalizeOptionalEmail(parsed.contact_email);
    const portalPassword =
      typeof parsed.portal_password === "string"
        ? parsed.portal_password.trim()
        : undefined;
    const requestedCreatedBy =
      parsed.created_by_profile_id === undefined
        ? undefined
        : (parsed.created_by_profile_id ?? null);
    const resolvedCreatedBy =
      requestedCreatedBy !== undefined
        ? requestedCreatedBy
        : (auth?.profileId ?? null);
    const resolvedSource = resolvePatientSource(
      parsed.source as PatientSource | undefined,
      resolvedCreatedBy,
    );
    const effectiveCreatedBy =
      resolvedSource === "organic" ? null : resolvedCreatedBy;
    const resolvedChannel = resolveCreatedChannel(
      parsed.created_channel as PatientCreationChannel | undefined,
      auth,
    );
    const canManageStatus =
      auth?.hasPermission(CONFIRM_PATIENT_PERMISSION) ?? false;
    const requestedStatus: PatientStatus = parsed.status ?? "potential";

    if (
      parsed.status !== undefined &&
      requestedStatus !== "potential" &&
      !canManageStatus
    ) {
      throw new ApiError(
        403,
        "Confirm patient permission is required to set status.",
      );
    }

    const resolvedStatus: PatientStatus =
      canManageStatus || requestedStatus === "potential"
        ? requestedStatus
        : "potential";

    // Prevent staff accounts from being registered as patients
    if (parsed.user_id) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(parsed.user_id);

      if (userError) {
        throw new ApiError(
          400,
          "Unable to verify user account.",
          userError.message,
        );
      }

      const accountType = userData.user?.user_metadata?.account_type;
      if (accountType === "staff") {
        throw new ApiError(
          400,
          "Staff accounts cannot be registered as patients. Use the admin console to manage staff access.",
        );
      }
    }

    const createPayload: PatientInsert = {
      full_name: trimmedFullName,
      user_id: parsed.user_id ?? null,
      date_of_birth: parsed.date_of_birth ?? null,
      sex: parsed.sex ?? null,
      nationality: trimOptionalString(parsed.nationality),
      contact_email: contactEmail,
      contact_phone: trimOptionalString(parsed.contact_phone),
      preferred_language: trimOptionalString(parsed.preferred_language),
      preferred_currency: trimOptionalString(parsed.preferred_currency),
      notes: trimOptionalString(parsed.notes),
      email_verified: parsed.email_verified ?? false,
      status: resolvedStatus,
      source: resolvedSource,
      created_by_profile_id: effectiveCreatedBy,
      created_channel: resolvedChannel,
      confirmed_at:
        resolvedStatus === "confirmed" ? new Date().toISOString() : null,
      confirmed_by:
        resolvedStatus === "confirmed" && auth?.profileId
          ? auth.profileId
          : null,
    };

    let effectiveEmailVerified = createPayload.email_verified;
    let portalAccount: { userId: string; createdNew: boolean } | null = null;

    if (portalPassword) {
      if (!contactEmail) {
        throw new ApiError(
          400,
          "Provide a patient email address to deliver the portal password.",
        );
      }

      if (parsed.user_id) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          parsed.user_id,
          {
            password: portalPassword,
            email: contactEmail,
            email_confirm: true,
            user_metadata: { full_name: trimmedFullName },
          },
        );

        if (updateError) {
          throw new ApiError(
            500,
            "Failed to update the linked portal user account.",
            updateError.message,
          );
        }

        portalAccount = { userId: parsed.user_id, createdNew: false };
        createPayload.user_id = parsed.user_id;
      } else {
        portalAccount = await createOrUpdatePortalAccount(supabase, {
          email: contactEmail,
          password: portalPassword,
          fullName: trimmedFullName,
          emailVerified: true,
        });
        createPayload.user_id = portalAccount.userId;
      }

      effectiveEmailVerified = true;
    }

    createPayload.email_verified = effectiveEmailVerified;

    let patient;
    try {
      patient = await patientService.create(createPayload);
    } catch (error) {
      if (portalAccount?.createdNew) {
        await supabase.auth.admin
          .deleteUser(portalAccount.userId)
          .catch(() => {});
      }
      throw error;
    }

    try {
      await syncProfileWithPatient(supabase, {
        userId: patient.user_id,
        fullName: patient.full_name,
        dateOfBirth: patient.date_of_birth,
        sex: patient.sex,
        nationality: patient.nationality,
        phone: patient.contact_phone,
      });
    } catch (error) {
      if (portalAccount?.createdNew) {
        await supabase.auth.admin
          .deleteUser(portalAccount.userId)
          .catch(() => {});
      }
      await patientService.remove(patient.id).catch(() => {});
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "Failed to synchronize patient profile details.",
        error instanceof Error ? error.message : undefined,
      );
    }

    if (portalPassword && contactEmail) {
      try {
        await sendPortalPasswordEmail(supabase, {
          email: contactEmail,
          fullName: trimmedFullName,
          password: portalPassword,
        });
      } catch (error) {
        if (portalAccount?.createdNew) {
          await supabase.auth.admin
            .deleteUser(portalAccount.userId)
            .catch(() => {});
        }
        await patientService.remove(patient.id).catch(() => {});
        throw error;
      }
    }

    return patient;
  },

  async update(id: unknown, payload: unknown, auth?: AuthorizationContext) {
    const patientId = patientIdSchema.parse(id);
    const parsed = updatePatientSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const supabase = getSupabaseAdmin();
    const existing = await patientService.getById(patientId);
    const existingPatient =
      existing as Database["public"]["Tables"]["patients"]["Row"];
    const canManageStatus =
      auth?.hasPermission(CONFIRM_PATIENT_PERMISSION) ?? false;
    const existingStatus =
      (existing as { status?: PatientStatus | null }).status ?? "potential";
    const existingSource =
      (existingPatient as { source?: PatientSource | null }).source ??
      "organic";
    const existingCreatedBy = existingPatient.created_by_profile_id ?? null;
    const existingChannel =
      (
        existingPatient as {
          created_channel?: PatientCreationChannel | null;
        }
      ).created_channel ?? "unknown";

    const updatePayload: PatientUpdate = {};

    const fullName =
      parsed.full_name !== undefined
        ? trimString(parsed.full_name)
        : trimString(existing.full_name);
    const parsedContactEmail =
      parsed.contact_email !== undefined
        ? normalizeOptionalEmail(parsed.contact_email)
        : undefined;
    const effectiveContactEmail =
      parsedContactEmail !== undefined
        ? parsedContactEmail
        : normalizeOptionalEmail(existing.contact_email);
    const portalPassword =
      typeof parsed.portal_password === "string"
        ? parsed.portal_password.trim()
        : undefined;
    const providedSource = parsed.source as PatientSource | undefined;
    const providedCreatedBy =
      parsed.created_by_profile_id !== undefined
        ? (parsed.created_by_profile_id ?? null)
        : undefined;
    const providedChannel = parsed.created_channel as
      | PatientCreationChannel
      | undefined;

    let nextSource = existingSource;
    let nextCreatedBy = existingCreatedBy;
    let nextChannel = existingChannel;

    if (providedCreatedBy !== undefined) {
      nextCreatedBy = providedCreatedBy;
    }

    if (providedSource !== undefined || providedCreatedBy !== undefined) {
      const fallbackCreatedBy = nextCreatedBy ?? auth?.profileId ?? null;
      nextSource = resolvePatientSource(providedSource, fallbackCreatedBy);

      if (nextSource !== "organic" && !nextCreatedBy) {
        nextCreatedBy = auth?.profileId ?? null;
      }

      if (nextSource === "organic") {
        nextCreatedBy = null;
      }

      if (providedChannel !== undefined) {
        nextChannel = providedChannel;
      } else if (nextSource !== existingSource) {
        nextChannel = resolveCreatedChannel(undefined, auth);
      }
    } else if (providedChannel !== undefined) {
      nextChannel = providedChannel;
    }

    if (nextSource !== existingSource) {
      updatePayload.source = nextSource;
    }

    if (nextCreatedBy !== existingCreatedBy) {
      updatePayload.created_by_profile_id = nextCreatedBy;
    }

    if (nextChannel !== existingChannel) {
      updatePayload.created_channel = nextChannel;
    }

    // Prevent staff accounts from being linked to patient records
    const targetUserId = parsed.user_id ?? existing.user_id ?? null;
    if (targetUserId && targetUserId !== existing.user_id) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(targetUserId);

      if (userError) {
        throw new ApiError(
          400,
          "Unable to verify user account.",
          userError.message,
        );
      }

      const accountType = userData.user?.user_metadata?.account_type;
      if (accountType === "staff") {
        throw new ApiError(
          400,
          "Staff accounts cannot be linked to patient records.",
        );
      }
    }

    if (parsed.full_name !== undefined) updatePayload.full_name = fullName;
    if (parsed.user_id !== undefined)
      updatePayload.user_id = parsed.user_id ?? null;
    if (parsed.date_of_birth !== undefined)
      updatePayload.date_of_birth = parsed.date_of_birth ?? null;
    if (parsed.sex !== undefined) updatePayload.sex = parsed.sex ?? null;
    if (parsed.nationality !== undefined)
      updatePayload.nationality = trimOptionalString(parsed.nationality);
    if (parsed.contact_email !== undefined)
      updatePayload.contact_email = parsedContactEmail ?? null;
    if (parsed.contact_phone !== undefined)
      updatePayload.contact_phone = trimOptionalString(parsed.contact_phone);
    if (parsed.preferred_language !== undefined)
      updatePayload.preferred_language = trimOptionalString(
        parsed.preferred_language,
      );
    if (parsed.preferred_currency !== undefined)
      updatePayload.preferred_currency = trimOptionalString(
        parsed.preferred_currency,
      );
    if (parsed.notes !== undefined)
      updatePayload.notes = trimOptionalString(parsed.notes);

    if (parsed.status !== undefined) {
      const requestedStatus = parsed.status;

      if (requestedStatus !== existingStatus && !canManageStatus) {
        throw new ApiError(
          403,
          "Confirm patient permission is required to change status.",
        );
      }

      if (canManageStatus && requestedStatus !== existingStatus) {
        updatePayload.status = requestedStatus;
        if (requestedStatus === "confirmed") {
          updatePayload.confirmed_at = new Date().toISOString();
          updatePayload.confirmed_by =
            auth?.profileId && auth.profileId.length > 0
              ? auth.profileId
              : null;
        } else {
          updatePayload.confirmed_at = null;
          updatePayload.confirmed_by = null;
        }
      }
    }

    let effectiveEmailVerified =
      parsed.email_verified !== undefined
        ? parsed.email_verified
        : (existing.email_verified ?? false);
    let portalAccount: { userId: string; createdNew: boolean } | null = null;

    if (portalPassword) {
      if (!effectiveContactEmail) {
        throw new ApiError(
          400,
          "Provide a patient email address to deliver the portal password.",
        );
      }

      if (targetUserId) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          targetUserId,
          {
            password: portalPassword,
            email: effectiveContactEmail,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          },
        );

        if (updateError) {
          throw new ApiError(
            500,
            "Failed to update the linked portal user account.",
            updateError.message,
          );
        }

        portalAccount = { userId: targetUserId, createdNew: false };
        updatePayload.user_id = targetUserId;
      } else {
        portalAccount = await createOrUpdatePortalAccount(supabase, {
          email: effectiveContactEmail,
          password: portalPassword,
          fullName,
          emailVerified: true,
        });
        updatePayload.user_id = portalAccount.userId;
      }

      effectiveEmailVerified = true;
    }

    updatePayload.email_verified = effectiveEmailVerified;

    const updated = await patientService.update(patientId, updatePayload);

    try {
      await syncProfileWithPatient(supabase, {
        userId: updated.user_id,
        fullName: updated.full_name,
        dateOfBirth: updated.date_of_birth,
        sex: updated.sex,
        nationality: updated.nationality,
        phone: updated.contact_phone,
      });
    } catch (error) {
      if (portalAccount?.createdNew) {
        await supabase.auth.admin
          .deleteUser(portalAccount.userId)
          .catch(() => {});
        portalAccount = null;
      }

      const revertPayload: PatientUpdate = {
        full_name: existing.full_name,
        user_id: existing.user_id ?? null,
        date_of_birth: existing.date_of_birth ?? null,
        sex: existing.sex ?? null,
        nationality: existing.nationality ?? null,
        contact_email: existing.contact_email ?? null,
        contact_phone: existing.contact_phone ?? null,
        preferred_language: existing.preferred_language ?? null,
        preferred_currency: existing.preferred_currency ?? null,
        notes: existing.notes ?? null,
        email_verified: existing.email_verified ?? null,
        status:
          (existing as { status?: PatientStatus | null }).status ?? "potential",
        confirmed_at:
          (existing as { confirmed_at?: string | null }).confirmed_at ?? null,
        confirmed_by:
          (existing as { confirmed_by?: string | null }).confirmed_by ?? null,
        source: existingSource,
        created_by_profile_id: existingCreatedBy,
        created_channel: existingChannel,
      };

      await patientService.update(patientId, revertPayload).catch(() => {});

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "Failed to synchronize patient profile details.",
        error instanceof Error ? error.message : undefined,
      );
    }

    if (portalPassword && effectiveContactEmail) {
      try {
        await sendPortalPasswordEmail(supabase, {
          email: effectiveContactEmail,
          fullName,
          password: portalPassword,
        });
      } catch (error) {
        if (portalAccount?.createdNew) {
          await supabase.auth.admin
            .deleteUser(portalAccount.userId)
            .catch(() => {});
          await patientService
            .update(patientId, {
              user_id: existing.user_id ?? null,
              email_verified: existing.email_verified ?? false,
            })
            .catch(() => {});
        }
        throw error;
      }
    }

    return updated;
  },

  async delete(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    const supabase = getSupabaseAdmin();

    // First, fetch the patient to get user_id for cleanup
    const patient = await patientService.getById(patientId);

    // Delete the patient record (this will cascade to consultations and appointments)
    await patientService.remove(patientId);

    // If patient has a user_id, delete the auth user (which will cascade delete the profile)
    // Only delete if it's not a staff account
    if (patient.user_id) {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(patient.user_id);

        if (!userError && userData?.user) {
          const accountType = userData.user.user_metadata?.account_type;

          // Only delete if it's not a staff account
          if (accountType !== "staff") {
            await supabase.auth.admin.deleteUser(patient.user_id);
            // Profile will be automatically deleted due to ON DELETE CASCADE
          }
        }
      } catch (error) {
        // Log error but don't fail the deletion - patient record is already deleted
        // This ensures patient deletion succeeds even if user cleanup fails
        console.error(
          `Failed to delete auth user for patient ${patientId}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return { success: true };
  },
};
