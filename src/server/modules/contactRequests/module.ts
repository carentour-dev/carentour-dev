

import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const STATUS_VALUES = ["new", "in_progress", "resolved"] as const;
const statusSchema = z.enum(STATUS_VALUES);

const optionalUuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  },
  z.string().uuid().nullable().optional(),
);

const createContactRequestSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  treatment: z.string().optional(),
  message: z.string().min(1),
  request_type: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: optionalUuid,
  status: statusSchema.optional(),
});

const updateContactRequestSchema = z
  .object({
    status: statusSchema.optional(),
    request_type: z.string().optional(),
    notes: z.string().optional(),
    assigned_to: optionalUuid,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  requestType: z.string().optional(),
});

const contactRequestIdSchema = z.string().uuid();

type ContactRequestInsert = Database["public"]["Tables"]["contact_requests"]["Insert"];
type ContactRequestUpdate = Database["public"]["Tables"]["contact_requests"]["Update"];
export type ContactRequestStatus = Database["public"]["Enums"]["contact_request_status"];

const contactRequestService = new CrudService("contact_requests", "contact request");

const trim = (value: string) => value.trim();

const trimOptional = (value: string | undefined): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const CONTACT_REQUEST_STATUSES = STATUS_VALUES;

export const contactRequestController = {
  async list(filters: { status?: ContactRequestStatus; requestType?: string } = {}) {
    const parsed = listFiltersSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.requestType) {
      query = query.eq("request_type", parsed.requestType);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, "Failed to load contact requests", error.message);
    }

    return (data ?? []) as Database["public"]["Tables"]["contact_requests"]["Row"][];
  },

  async get(id: unknown) {
    const contactRequestId = contactRequestIdSchema.parse(id);
    return contactRequestService.getById(contactRequestId);
  },

  async create(payload: unknown) {
    const parsed = createContactRequestSchema.parse(payload);

    const insertPayload: ContactRequestInsert = {
      first_name: trim(parsed.first_name),
      last_name: trim(parsed.last_name),
      email: trim(parsed.email).toLowerCase(),
      phone: trimOptional(parsed.phone),
      country: trimOptional(parsed.country),
      treatment: trimOptional(parsed.treatment),
      message: trim(parsed.message),
      request_type: parsed.request_type ? trim(parsed.request_type) : "general",
      notes: trimOptional(parsed.notes),
      assigned_to: parsed.assigned_to ?? null,
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

    const updatePayload: ContactRequestUpdate = {};

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
      updatePayload.resolved_at =
        parsed.status === "resolved" ? new Date().toISOString() : null;
    }

    if (parsed.request_type !== undefined) {
      const trimmedType = trim(parsed.request_type);
      updatePayload.request_type = trimmedType.length > 0 ? trimmedType : "general";
    }

    if (parsed.notes !== undefined) {
      updatePayload.notes = trimOptional(parsed.notes);
    }

    if (parsed.assigned_to !== undefined) {
      updatePayload.assigned_to = parsed.assigned_to ?? null;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return contactRequestService.update(contactRequestId, updatePayload);
  },

  async delete(id: unknown) {
    const contactRequestId = contactRequestIdSchema.parse(id);
    return contactRequestService.remove(contactRequestId);
  },
};
