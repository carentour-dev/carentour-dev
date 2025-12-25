import { randomUUID } from "crypto";
import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database, Json } from "@/integrations/supabase/types";

const STATUS_VALUES = ["new", "in_progress", "resolved"] as const;
const statusSchema = z.enum(STATUS_VALUES);
const ORIGIN_VALUES = ["web", "portal", "manual"] as const;
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

const createContactRequestSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  treatment: z.string().optional(),
  destination: z.string().optional(),
  travel_window: z.string().optional(),
  health_background: z.string().optional(),
  budget_range: z.string().optional(),
  companions: z.string().optional(),
  medical_reports: z.string().optional(),
  contact_preference: z.string().optional(),
  additional_questions: z.string().optional(),
  message: z.string().min(1),
  request_type: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: optionalUuid,
  user_id: optionalUuid,
  patient_id: optionalUuid,
  origin: originSchema,
  portal_metadata: jsonSchema.optional(),
  documents: jsonSchema.optional(),
  status: statusSchema.optional(),
});

const updateContactRequestSchema = z
  .object({
    status: statusSchema.optional(),
    request_type: z.string().optional(),
    notes: z.string().optional(),
    assigned_to: optionalUuid,
    destination: z.string().optional(),
    travel_window: z.string().optional(),
    health_background: z.string().optional(),
    budget_range: z.string().optional(),
    companions: z.string().optional(),
    medical_reports: z.string().optional(),
    contact_preference: z.string().optional(),
    additional_questions: z.string().optional(),
    user_id: optionalUuid,
    patient_id: optionalUuid,
    origin: originSchema,
    portal_metadata: jsonSchema.optional(),
    documents: jsonSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  requestType: z.string().optional(),
  assignedTo: optionalUuid,
});

const contactRequestIdSchema = z.string().uuid();

type ContactRequestInsert =
  Database["public"]["Tables"]["contact_requests"]["Insert"];
type ContactRequestUpdate =
  Database["public"]["Tables"]["contact_requests"]["Update"];
export type ContactRequestStatus =
  Database["public"]["Enums"]["contact_request_status"];

const contactRequestService = new CrudService(
  "contact_requests",
  "contact request",
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
): ContactRequestInsert["origin"] => {
  if (
    origin &&
    ORIGIN_VALUES.includes(origin as (typeof ORIGIN_VALUES)[number])
  ) {
    return origin as ContactRequestInsert["origin"];
  }
  return hasUser ? "portal" : "web";
};

export const CONTACT_REQUEST_STATUSES = STATUS_VALUES;
const PATIENT_DOCUMENT_BUCKET = "patient-documents";

type ContactRequestDocument = {
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

const normalizeDocuments = (value: unknown): ContactRequestDocument[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ContactRequestDocument => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as ContactRequestDocument;
    return (
      typeof candidate.path === "string" &&
      candidate.path.length > 0 &&
      typeof candidate.bucket === "string" &&
      candidate.bucket.length > 0
    );
  });
};

const moveDocumentsToPatientFolder = async (
  documents: ContactRequestDocument[],
  patientId: string,
) => {
  if (!patientId || documents.length === 0) return documents;

  const supabase = getSupabaseAdmin();
  const moved: ContactRequestDocument[] = [];

  for (const doc of documents) {
    const bucket =
      typeof doc.bucket === "string" && doc.bucket.length > 0
        ? doc.bucket
        : PATIENT_DOCUMENT_BUCKET;
    const path = doc.path ?? "";
    if (
      !path.startsWith("consultations/") ||
      path.startsWith(`consultations/${patientId}/`)
    ) {
      moved.push({ ...doc, bucket, path });
      continue;
    }

    const fileName =
      (doc.storedName && doc.storedName.trim().length > 0
        ? doc.storedName
        : path.split("/").pop()) ?? `file-${randomUUID().slice(0, 8)}`;

    let targetPath = `consultations/${patientId}/${fileName}`;
    let finalPath = path;

    const moveOrCopy = async (from: string, to: string) => {
      const moveResult = await supabase.storage.from(bucket).move(from, to);
      if (!moveResult.error) return { path: to, success: true };

      const copyResult = await supabase.storage.from(bucket).copy(from, to);
      if (!copyResult.error) {
        await supabase.storage.from(bucket).remove([from]);
        return { path: to, success: true };
      }

      return { path: from, success: false };
    };

    const initialMove = await moveOrCopy(path, targetPath);

    if (!initialMove.success) {
      const fallbackPath = `consultations/${patientId}/${randomUUID().slice(0, 8)}-${fileName}`;
      const fallbackMove = await moveOrCopy(path, fallbackPath);
      finalPath = fallbackMove.path;
    } else {
      finalPath = initialMove.path;
    }

    moved.push({ ...doc, bucket, path: finalPath });
  }

  return moved;
};

export const contactRequestController = {
  async list(
    filters: { status?: ContactRequestStatus; requestType?: string } = {},
  ) {
    const parsed = listFiltersSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("contact_requests")
      .select(
        `
          *,
          assigned_profile:profiles!contact_requests_assigned_to_fkey(
            id,
            username,
            avatar_url,
            email,
            job_title
          ),
          assigned_secure_profile:secure_profiles!contact_requests_assigned_to_fkey(
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

    if (parsed.requestType) {
      query = query.eq("request_type", parsed.requestType);
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
      throw new ApiError(500, "Failed to load contact requests", error.message);
    }

    return (data ??
      []) as Database["public"]["Tables"]["contact_requests"]["Row"][];
  },

  async get(id: unknown) {
    const contactRequestId = contactRequestIdSchema.parse(id);
    return contactRequestService.getById(contactRequestId);
  },

  async create(payload: unknown) {
    const parsed = createContactRequestSchema.parse(payload);
    const normalizedDocuments = normalizeDocuments(parsed.documents);

    const insertPayload: ContactRequestInsert = {
      documents: normalizedDocuments.length > 0 ? normalizedDocuments : null,
      first_name: trim(parsed.first_name),
      last_name: trim(parsed.last_name),
      email: trim(parsed.email).toLowerCase(),
      phone: trimOptional(parsed.phone),
      country: trimOptional(parsed.country),
      treatment: trimOptional(parsed.treatment),
      destination: trimOptional(parsed.destination),
      travel_window: trimOptional(parsed.travel_window),
      health_background: trimOptional(parsed.health_background),
      budget_range: trimOptional(parsed.budget_range),
      companions: trimOptional(parsed.companions),
      medical_reports: trimOptional(parsed.medical_reports),
      contact_preference: trimOptional(parsed.contact_preference),
      additional_questions: trimOptional(parsed.additional_questions),
      message: trim(parsed.message),
      request_type: parsed.request_type ? trim(parsed.request_type) : "general",
      notes: trimOptional(parsed.notes),
      assigned_to: parsed.assigned_to ?? null,
      user_id: parsed.user_id ?? null,
      patient_id: parsed.patient_id ?? null,
      origin: sanitizeOrigin(parsed.origin, parsed.user_id != null),
      portal_metadata: parsed.portal_metadata ?? null,
      status: parsed.status ?? "new",
    };

    if (insertPayload.status === "resolved") {
      insertPayload.resolved_at = new Date().toISOString();
    }

    return contactRequestService.create(insertPayload);
  },

  async update(id: unknown, payload: unknown) {
    const contactRequestId = contactRequestIdSchema.parse(id);
    const parsed = updateContactRequestSchema.parse(payload);

    const supabase = getSupabaseAdmin();
    const { data: existingRequest, error: existingError } = await supabase
      .from("contact_requests")
      .select("patient_id, documents")
      .eq("id", contactRequestId)
      .maybeSingle();

    if (existingError) {
      throw new ApiError(
        500,
        "Failed to load contact request",
        existingError.message,
      );
    }

    const updatePayload: ContactRequestUpdate = {};

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
      updatePayload.resolved_at =
        parsed.status === "resolved" ? new Date().toISOString() : null;
    }

    if (parsed.request_type !== undefined) {
      const trimmedType = trim(parsed.request_type);
      updatePayload.request_type =
        trimmedType.length > 0 ? trimmedType : "general";
    }

    if (parsed.notes !== undefined) {
      updatePayload.notes = trimOptional(parsed.notes);
    }

    if (parsed.assigned_to !== undefined) {
      updatePayload.assigned_to = parsed.assigned_to ?? null;
    }

    if (parsed.destination !== undefined) {
      updatePayload.destination = trimOptional(parsed.destination);
    }

    if (parsed.travel_window !== undefined) {
      updatePayload.travel_window = trimOptional(parsed.travel_window);
    }

    if (parsed.health_background !== undefined) {
      updatePayload.health_background = trimOptional(parsed.health_background);
    }

    if (parsed.budget_range !== undefined) {
      updatePayload.budget_range = trimOptional(parsed.budget_range);
    }

    if (parsed.companions !== undefined) {
      updatePayload.companions = trimOptional(parsed.companions);
    }

    if (parsed.medical_reports !== undefined) {
      updatePayload.medical_reports = trimOptional(parsed.medical_reports);
    }

    if (parsed.contact_preference !== undefined) {
      updatePayload.contact_preference = trimOptional(
        parsed.contact_preference,
      );
    }

    if (parsed.additional_questions !== undefined) {
      updatePayload.additional_questions = trimOptional(
        parsed.additional_questions,
      );
    }

    if (parsed.user_id !== undefined) {
      updatePayload.user_id = parsed.user_id ?? null;
    }

    if (parsed.patient_id !== undefined) {
      updatePayload.patient_id = parsed.patient_id ?? null;
    }

    if (parsed.origin !== undefined) {
      updatePayload.origin = sanitizeOrigin(
        parsed.origin,
        parsed.user_id != null,
      );
    }

    if (parsed.portal_metadata !== undefined) {
      updatePayload.portal_metadata = parsed.portal_metadata ?? null;
    }

    if (parsed.documents !== undefined) {
      const normalized = normalizeDocuments(parsed.documents);
      updatePayload.documents = normalized.length > 0 ? normalized : null;
    }

    const targetPatientId =
      parsed.patient_id !== undefined
        ? parsed.patient_id
        : (existingRequest?.patient_id ?? null);

    const currentDocuments =
      updatePayload.documents !== undefined
        ? normalizeDocuments(updatePayload.documents)
        : normalizeDocuments(existingRequest?.documents);

    if (targetPatientId && currentDocuments.length > 0) {
      const moved = await moveDocumentsToPatientFolder(
        currentDocuments,
        targetPatientId,
      );
      updatePayload.documents = moved;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return contactRequestService.update(contactRequestId, updatePayload);
  },

  async delete(id: unknown) {
    const contactRequestId = contactRequestIdSchema.parse(id);
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("contact_requests")
      .select("documents")
      .eq("id", contactRequestId)
      .maybeSingle();

    const result = await contactRequestService.remove(contactRequestId);

    const documents = normalizeDocuments(existing?.documents);
    if (documents.length > 0) {
      for (const doc of documents) {
        try {
          await supabase.storage
            .from(doc.bucket ?? PATIENT_DOCUMENT_BUCKET)
            .remove([doc.path ?? ""]);
        } catch (error) {
          console.error(
            "[contactRequests][delete] Failed to remove attachment",
            doc.path,
            error,
          );
        }
      }
    }

    return result;
  },
};
