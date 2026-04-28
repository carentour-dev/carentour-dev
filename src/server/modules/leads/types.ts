import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export const LEAD_STATUSES = [
  "new",
  "reviewing",
  "qualified",
  "converted",
  "duplicate",
  "disqualified",
  "archived",
] as const;

export const LEAD_URGENCY_TIERS = ["low", "medium", "high", "urgent"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadUrgencyTier = (typeof LEAD_URGENCY_TIERS)[number];

export type LeadRecord = {
  id: string;
  status: LeadStatus;
  source: string;
  channel: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  normalized_email: string | null;
  phone: string | null;
  normalized_phone: string | null;
  country: string | null;
  language: string | null;
  procedure_interest: string | null;
  message: string | null;
  quality_score: number | null;
  urgency_tier: LeadUrgencyTier;
  has_medical_documents: boolean;
  ready_for_consultation: boolean;
  disqualification_reason: string | null;
  assigned_to: string | null;
  contact_request_id: string | null;
  start_journey_submission_id: string | null;
  patient_id: string | null;
  duplicate_of_lead_id: string | null;
  metadata: Json;
  raw_payload: Json;
  last_seen_at: string;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_profile?: {
    id: string;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
};

export type LeadEventRecord = {
  id: string;
  lead_id: string;
  event_type: string;
  title: string;
  body: string | null;
  actor_profile_id: string | null;
  payload: Json;
  created_at: string;
};

export type LeadDetails = LeadRecord & {
  events: LeadEventRecord[];
  attribution: Array<Record<string, unknown>>;
  external_identities: Array<Record<string, unknown>>;
  marketing_consents: Array<Record<string, unknown>>;
  automation_runs: Array<Record<string, unknown>>;
};

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

export const leadPayloadSchema = z
  .object({
    source: z.string().min(1).default("unknown"),
    channel: z.string().optional(),
    provider: z.string().optional(),
    externalId: z.string().optional(),
    externalIds: z.record(z.string()).optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    language: z.string().optional(),
    procedureInterest: z.string().optional(),
    treatment: z.string().optional(),
    message: z.string().optional(),
    qualityScore: z.number().int().min(0).max(100).optional(),
    urgencyTier: z.enum(LEAD_URGENCY_TIERS).optional(),
    hasMedicalDocuments: z.boolean().optional(),
    readyForConsultation: z.boolean().optional(),
    attribution: z.record(jsonSchema).optional(),
    consents: z.record(z.boolean()).optional(),
    metadata: z.record(jsonSchema).optional(),
    rawPayload: jsonSchema.optional(),
  })
  .passthrough();

export type LeadPayload = z.infer<typeof leadPayloadSchema>;
