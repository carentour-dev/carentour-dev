import { randomUUID } from "crypto";
import { z } from "zod";
import { contactRequestController } from "@/server/modules/contactRequests/module";
import { patientController } from "@/server/modules/patients/module";
import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import type { AuthorizationContext } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import {
  normalizeLeadEmail,
  normalizeLeadPhone,
  splitLeadName,
} from "@/lib/leads/normalization";
import {
  LEAD_STATUSES,
  LEAD_URGENCY_TIERS,
  leadPayloadSchema,
  type LeadDetails,
  type LeadPayload,
  type LeadRecord,
  type LeadStatus,
} from "./types";

const TERMINAL_LEAD_STATUSES = [
  "converted",
  "duplicate",
  "disqualified",
  "archived",
] as const;

type ExternalIdentityRecord = {
  entity_type: string;
  entity_id: string;
  provider: string;
  external_id: string;
};

const leadIdSchema = z.string().uuid();
const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const updateLeadSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    assigned_to: optionalUuid,
    notes: z.string().optional(),
    quality_score: z.number().int().min(0).max(100).nullable().optional(),
    urgency_tier: z.enum(LEAD_URGENCY_TIERS).optional(),
    procedure_interest: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    ready_for_consultation: z.boolean().optional(),
    has_medical_documents: z.boolean().optional(),
    disqualification_reason: z.string().nullable().optional(),
    duplicate_of_lead_id: optionalUuid,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const convertLeadSchema = z.object({
  action: z.enum([
    "contact_request",
    "start_journey",
    "patient",
    "existing_patient",
  ]),
  patient_id: optionalUuid,
  notes: z.string().optional(),
});

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getFullNameParts = (payload: LeadPayload) => {
  const fromName = splitLeadName(payload.fullName ?? payload.name);
  const firstName = toNullableString(payload.firstName) ?? fromName.firstName;
  const lastName = toNullableString(payload.lastName) ?? fromName.lastName;
  const fullName =
    fromName.fullName ??
    [firstName, lastName].filter(Boolean).join(" ").trim() ??
    null;

  return {
    fullName: fullName && fullName.length > 0 ? fullName : null,
    firstName,
    lastName,
  };
};

const buildExternalIds = (payload: LeadPayload) => {
  const ids: Array<{ provider: string; externalId: string }> = [];
  const provider = toNullableString(payload.provider ?? payload.source);
  const externalId = toNullableString(payload.externalId);

  if (provider && externalId) {
    ids.push({ provider, externalId });
  }

  if (payload.externalIds) {
    for (const [key, value] of Object.entries(payload.externalIds)) {
      const normalizedProvider = toNullableString(key);
      const normalizedId = toNullableString(value);
      if (normalizedProvider && normalizedId) {
        ids.push({
          provider: normalizedProvider,
          externalId: normalizedId,
        });
      }
    }
  }

  return Array.from(
    new Map(
      ids.map((identity) => [
        `${identity.provider}:${identity.externalId}`,
        identity,
      ]),
    ).values(),
  );
};

const insertLeadEvent = async (args: {
  leadId: string;
  eventType: string;
  title: string;
  body?: string | null;
  actorProfileId?: string | null;
  payload?: Record<string, unknown>;
}) => {
  const supabase = getSupabaseAdmin() as any;
  const { error } = await supabase.from("lead_events").insert({
    lead_id: args.leadId,
    event_type: args.eventType,
    title: args.title,
    body: args.body ?? null,
    actor_profile_id: args.actorProfileId ?? null,
    payload: args.payload ?? {},
  });

  if (error) {
    throw new ApiError(500, "Failed to write lead event", error.message);
  }
};

const loadLeadById = async (id: string) => {
  const supabase = getSupabaseAdmin() as any;
  const { data, error } = await supabase
    .from("lead_inquiries")
    .select(
      `
        *,
        assigned_profile:profiles!lead_inquiries_assigned_to_fkey(
          id,
          username,
          email,
          avatar_url,
          job_title
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load lead", error.message);
  }

  if (!data) {
    throw new ApiError(404, "Lead not found");
  }

  return data as LeadRecord;
};

const loadLeadForIdentity = async (identity: ExternalIdentityRecord) => {
  try {
    return await loadLeadById(identity.entity_id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        409,
        "Lead ingestion is already in progress for this external identity.",
      );
    }
    throw error;
  }
};

const findIdentityMatch = async (
  externalIds: Array<{ provider: string; externalId: string }>,
) => {
  if (externalIds.length === 0) {
    return null;
  }

  const supabase = getSupabaseAdmin() as any;
  for (const identity of externalIds) {
    const { data, error } = await supabase
      .from("external_identities")
      .select("*")
      .eq("provider", identity.provider)
      .eq("external_id", identity.externalId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to resolve external identity",
        error.message,
      );
    }

    if (data) {
      return data as ExternalIdentityRecord;
    }
  }

  return null;
};

const findRecentLeadMatch = async (args: {
  normalizedEmail: string | null;
  normalizedPhone: string | null;
}) => {
  const supabase = getSupabaseAdmin() as any;
  const clauses: string[] = [];
  if (args.normalizedEmail) {
    clauses.push(`normalized_email.eq.${args.normalizedEmail}`);
  }
  if (args.normalizedPhone) {
    clauses.push(`normalized_phone.eq.${args.normalizedPhone}`);
  }

  if (clauses.length === 0) {
    return null;
  }

  const recentThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("lead_inquiries")
    .select("*")
    .or(clauses.join(","))
    .not("status", "in", `(${TERMINAL_LEAD_STATUSES.join(",")})`)
    .gte("created_at", recentThreshold.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to resolve duplicate lead", error.message);
  }

  return (data as LeadRecord | null) ?? null;
};

const findPatientMatch = async (args: {
  normalizedEmail: string | null;
  normalizedPhone: string | null;
}) => {
  const supabase = getSupabaseAdmin() as any;
  const clauses: string[] = [];
  if (args.normalizedEmail) {
    clauses.push(`contact_email.eq.${args.normalizedEmail}`);
  }
  if (args.normalizedPhone) {
    clauses.push(`contact_phone.eq.${args.normalizedPhone}`);
  }

  if (clauses.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("patients")
    .select("id, status, full_name, contact_email, contact_phone")
    .or(clauses.join(","))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to resolve patient match", error.message);
  }

  return data as {
    id: string;
    status: "potential" | "confirmed";
    full_name: string;
  } | null;
};

const isUniqueViolation = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate key") === true;

const cleanupLeadIdentityClaims = async (
  leadId: string,
  externalIds: Array<{ provider: string; externalId: string }>,
) => {
  if (externalIds.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin() as any;
  for (const identity of externalIds) {
    await supabase
      .from("external_identities")
      .delete()
      .eq("entity_type", "lead")
      .eq("entity_id", leadId)
      .eq("provider", identity.provider)
      .eq("external_id", identity.externalId);
  }
};

const insertExternalIdentity = async (
  leadId: string,
  identity: { provider: string; externalId: string },
) => {
  const supabase = getSupabaseAdmin() as any;
  const { error } = await supabase.from("external_identities").insert({
    entity_type: "lead",
    entity_id: leadId,
    provider: identity.provider,
    external_id: identity.externalId,
  });

  if (!error) {
    return null;
  }

  if (isUniqueViolation(error)) {
    return findIdentityMatch([identity]);
  }

  throw new ApiError(500, "Failed to store external identity", error.message);
};

const claimExternalIdentitiesForLead = async (
  leadId: string,
  externalIds: Array<{ provider: string; externalId: string }>,
) => {
  if (externalIds.length === 0) {
    return null;
  }

  const claimed: Array<{ provider: string; externalId: string }> = [];

  for (const identity of externalIds) {
    const conflict = await insertExternalIdentity(leadId, identity);
    if (conflict) {
      await cleanupLeadIdentityClaims(leadId, claimed);
      return conflict;
    }
    claimed.push(identity);
  }

  return null;
};

const storeExternalIdentitiesForLead = async (
  leadId: string,
  externalIds: Array<{ provider: string; externalId: string }>,
) => {
  for (const identity of externalIds) {
    const conflict = await insertExternalIdentity(leadId, identity);
    if (
      conflict &&
      (conflict.entity_type !== "lead" || conflict.entity_id !== leadId)
    ) {
      console.warn("[leads] external identity already belongs to another row", {
        provider: identity.provider,
        entityType: conflict.entity_type,
        entityId: conflict.entity_id,
      });
    }
  }
};

const insertAttribution = async (leadId: string, payload: LeadPayload) => {
  if (!payload.attribution) {
    return;
  }

  const attribution = payload.attribution;
  const supabase = getSupabaseAdmin() as any;
  const { error } = await supabase.from("lead_attribution").insert({
    lead_id: leadId,
    source: toNullableString(attribution.source) ?? payload.source,
    medium: toNullableString(attribution.medium),
    campaign: toNullableString(attribution.campaign),
    content: toNullableString(attribution.content),
    term: toNullableString(attribution.term),
    click_id:
      toNullableString(attribution.clickId) ??
      toNullableString(attribution.click_id),
    landing_page:
      toNullableString(attribution.landingPage) ??
      toNullableString(attribution.landing_page),
    referrer: toNullableString(attribution.referrer),
    raw_attribution: attribution,
  });

  if (error) {
    throw new ApiError(500, "Failed to store lead attribution", error.message);
  }
};

const insertConsents = async (leadId: string, payload: LeadPayload) => {
  if (!payload.consents) {
    return;
  }

  const rows = Object.entries(payload.consents).map(([channel, optedIn]) => ({
    lead_id: leadId,
    channel,
    opted_in: optedIn,
    consent_source: payload.source,
    preferred_channel: payload.channel ?? null,
    preferred_language: payload.language ?? null,
  }));

  if (rows.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin() as any;
  const { error } = await supabase.from("marketing_consents").insert(rows);
  if (error) {
    throw new ApiError(500, "Failed to store lead consents", error.message);
  }
};

const buildLeadInsert = (payload: LeadPayload, patientId: string | null) => {
  const nameParts = getFullNameParts(payload);
  const normalizedEmail = normalizeLeadEmail(payload.email);
  const normalizedPhone = normalizeLeadPhone(payload.phone);
  const procedureInterest =
    toNullableString(payload.procedureInterest) ??
    toNullableString(payload.treatment);

  return {
    status: "new" satisfies LeadStatus,
    source: payload.source.trim(),
    channel: toNullableString(payload.channel),
    full_name: nameParts.fullName,
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    email: normalizeLeadEmail(payload.email),
    normalized_email: normalizedEmail,
    phone: toNullableString(payload.phone),
    normalized_phone: normalizedPhone,
    country: toNullableString(payload.country),
    language: toNullableString(payload.language),
    procedure_interest: procedureInterest,
    message: toNullableString(payload.message),
    quality_score: payload.qualityScore ?? null,
    urgency_tier: payload.urgencyTier ?? "medium",
    has_medical_documents: payload.hasMedicalDocuments ?? false,
    ready_for_consultation: payload.readyForConsultation ?? false,
    patient_id: patientId,
    metadata: payload.metadata ?? {},
    raw_payload: payload.rawPayload ?? payload,
  };
};

const getConvertedLeadTarget = (lead: LeadRecord) => {
  if (lead.contact_request_id) {
    return { type: "contact_request", id: lead.contact_request_id };
  }
  if (lead.start_journey_submission_id) {
    return {
      type: "start_journey_submission",
      id: lead.start_journey_submission_id,
    };
  }
  if (lead.patient_id) {
    return { type: "patient", id: lead.patient_id };
  }
  return null;
};

const restoreLeadAfterFailedConversion = async (
  lead: LeadRecord,
  auth?: AuthorizationContext,
) => {
  const supabase = getSupabaseAdmin() as any;
  let query = supabase
    .from("lead_inquiries")
    .update({
      status: lead.status,
      converted_at: lead.converted_at ?? null,
    })
    .eq("id", lead.id)
    .is("contact_request_id", null)
    .is("start_journey_submission_id", null);

  query = lead.patient_id
    ? query.eq("patient_id", lead.patient_id)
    : query.is("patient_id", null);

  const { error } = await query;

  if (!error) {
    await insertLeadEvent({
      leadId: lead.id,
      eventType: "conversion_failed",
      title: "Lead conversion failed",
      actorProfileId: auth?.profileId ?? null,
    });
  }
};

const cleanupConversionTarget = async (target: Record<string, unknown>) => {
  const id = typeof target.id === "string" ? target.id : null;
  if (!id) {
    return;
  }

  const supabase = getSupabaseAdmin() as any;
  if (target.type === "contact_request") {
    await supabase.from("contact_requests").delete().eq("id", id);
  } else if (target.type === "start_journey_submission") {
    await supabase.from("start_journey_submissions").delete().eq("id", id);
  } else if (target.type === "patient" && target.created === true) {
    await supabase.from("patients").delete().eq("id", id).eq("source", "staff");
  }
};

const assertDuplicateTargetDoesNotCycle = async (
  leadId: string,
  duplicateTargetId: string,
) => {
  const visited = new Set<string>();
  let currentId: string | null = duplicateTargetId;

  while (currentId) {
    if (currentId === leadId) {
      throw new ApiError(400, "Duplicate lead links cannot form a cycle.");
    }

    if (visited.has(currentId)) {
      throw new ApiError(
        400,
        "Selected duplicate target already belongs to a duplicate cycle.",
      );
    }

    visited.add(currentId);
    const currentLead = await loadLeadById(currentId);
    currentId = currentLead.duplicate_of_lead_id;
  }
};

export const leadController = {
  async list(filters: {
    status?: string | null;
    source?: string | null;
    country?: string | null;
    urgency?: string | null;
    assignedTo?: string | null;
  }) {
    const supabase = getSupabaseAdmin() as any;
    let query = supabase
      .from("lead_inquiries")
      .select(
        `
          *,
          assigned_profile:profiles!lead_inquiries_assigned_to_fkey(
            id,
            username,
            email,
            avatar_url,
            job_title
          )
        `,
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.source && filters.source !== "all") {
      query = query.eq("source", filters.source);
    }
    if (filters.country && filters.country !== "all") {
      query = query.ilike("country", filters.country);
    }
    if (filters.urgency && filters.urgency !== "all") {
      query = query.eq("urgency_tier", filters.urgency);
    }
    if (filters.assignedTo === "unassigned") {
      query = query.is("assigned_to", null);
    } else if (filters.assignedTo) {
      query = query.eq("assigned_to", filters.assignedTo);
    }

    const { data, error } = await query;
    if (error) {
      throw new ApiError(500, "Failed to load leads", error.message);
    }

    return (data ?? []) as LeadRecord[];
  },

  async get(id: unknown): Promise<LeadDetails> {
    const leadId = leadIdSchema.parse(id);
    const lead = await loadLeadById(leadId);
    const supabase = getSupabaseAdmin() as any;

    const [
      eventsResult,
      attributionResult,
      identitiesResult,
      consentsResult,
      automationResult,
    ] = await Promise.all([
      supabase
        .from("lead_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_attribution")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase
        .from("external_identities")
        .select("*")
        .eq("entity_type", "lead")
        .eq("entity_id", leadId),
      supabase
        .from("marketing_consents")
        .select("*")
        .eq("lead_id", leadId)
        .order("captured_at", { ascending: false }),
      supabase
        .from("automation_runs")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      ...lead,
      events: eventsResult.data ?? [],
      attribution: attributionResult.data ?? [],
      external_identities: identitiesResult.data ?? [],
      marketing_consents: consentsResult.data ?? [],
      automation_runs: automationResult.data ?? [],
    };
  },

  async createFromIntegration(rawPayload: unknown) {
    const payload = leadPayloadSchema.parse(rawPayload);
    const externalIds = buildExternalIds(payload);
    const normalizedEmail = normalizeLeadEmail(payload.email);
    const normalizedPhone = normalizeLeadPhone(payload.phone);

    let identityMatch = await findIdentityMatch(externalIds);
    if (identityMatch?.entity_type === "lead") {
      const existingLead = await loadLeadForIdentity(identityMatch);
      const supabase = getSupabaseAdmin() as any;
      await supabase
        .from("lead_inquiries")
        .update({
          last_seen_at: new Date().toISOString(),
          raw_payload: payload.rawPayload ?? payload,
        })
        .eq("id", existingLead.id);
      await insertLeadEvent({
        leadId: existingLead.id,
        eventType: "duplicate_ingested",
        title: "Duplicate external lead received",
        body: `Matched ${identityMatch.provider} identity.`,
        payload,
      });
      return {
        lead: await loadLeadById(existingLead.id),
        resolution: "existing_raw_lead",
      };
    }

    const recentLead = await findRecentLeadMatch({
      normalizedEmail,
      normalizedPhone,
    });
    if (recentLead) {
      await insertLeadEvent({
        leadId: recentLead.id,
        eventType: "duplicate_ingested",
        title: "Potential duplicate lead received",
        body: "Matched by normalized contact details.",
        payload,
      });
      await storeExternalIdentitiesForLead(recentLead.id, externalIds);
      return { lead: recentLead, resolution: "duplicate_lead" };
    }

    const supabase = getSupabaseAdmin() as any;
    const leadId = randomUUID();
    if (!identityMatch) {
      identityMatch = await claimExternalIdentitiesForLead(leadId, externalIds);
      if (identityMatch?.entity_type === "lead") {
        const existingLead = await loadLeadForIdentity(identityMatch);
        await insertLeadEvent({
          leadId: existingLead.id,
          eventType: "duplicate_ingested",
          title: "Duplicate external lead received",
          body: `Matched ${identityMatch.provider} identity.`,
          payload,
        });
        return {
          lead: await loadLeadById(existingLead.id),
          resolution: "existing_raw_lead",
        };
      }
    }

    const patientMatch =
      identityMatch?.entity_type === "patient"
        ? { id: identityMatch.entity_id, status: "confirmed" as const }
        : await findPatientMatch({ normalizedEmail, normalizedPhone });

    const { data, error } = await supabase
      .from("lead_inquiries")
      .insert({
        id: leadId,
        ...buildLeadInsert(payload, patientMatch?.id ?? null),
      })
      .select("*")
      .single();

    if (error) {
      await cleanupLeadIdentityClaims(leadId, externalIds);
      throw new ApiError(500, "Failed to create lead", error.message);
    }

    const lead = data as LeadRecord;
    await Promise.all([
      insertLeadEvent({
        leadId: lead.id,
        eventType: patientMatch ? "reengagement" : "created",
        title: patientMatch
          ? "Lead matched to existing patient"
          : "Lead inquiry created",
        body:
          patientMatch?.status === "confirmed"
            ? "Recorded as patient re-engagement without creating a new patient."
            : null,
        payload,
      }),
      identityMatch
        ? Promise.resolve()
        : storeExternalIdentitiesForLead(lead.id, externalIds),
      insertAttribution(lead.id, payload),
      insertConsents(lead.id, payload),
    ]);

    return {
      lead: await loadLeadById(lead.id),
      resolution: patientMatch
        ? patientMatch.status === "confirmed"
          ? "confirmed_patient_reengagement"
          : "potential_patient_match"
        : "new_lead",
    };
  },

  async update(id: unknown, payload: unknown, auth?: AuthorizationContext) {
    const leadId = leadIdSchema.parse(id);
    const parsed = updateLeadSchema.parse(payload);
    const supabase = getSupabaseAdmin() as any;

    const updatePayload: Record<string, unknown> = {};
    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
    }
    if (parsed.assigned_to !== undefined) {
      updatePayload.assigned_to = parsed.assigned_to ?? null;
    }
    if (parsed.quality_score !== undefined) {
      updatePayload.quality_score = parsed.quality_score;
    }
    if (parsed.urgency_tier !== undefined) {
      updatePayload.urgency_tier = parsed.urgency_tier;
    }
    if (parsed.procedure_interest !== undefined) {
      updatePayload.procedure_interest = toNullableString(
        parsed.procedure_interest,
      );
    }
    if (parsed.country !== undefined) {
      updatePayload.country = toNullableString(parsed.country);
    }
    if (parsed.language !== undefined) {
      updatePayload.language = toNullableString(parsed.language);
    }
    if (parsed.ready_for_consultation !== undefined) {
      updatePayload.ready_for_consultation = parsed.ready_for_consultation;
    }
    if (parsed.has_medical_documents !== undefined) {
      updatePayload.has_medical_documents = parsed.has_medical_documents;
    }
    if (parsed.disqualification_reason !== undefined) {
      updatePayload.disqualification_reason = toNullableString(
        parsed.disqualification_reason,
      );
    }
    if (parsed.duplicate_of_lead_id !== undefined) {
      if (parsed.duplicate_of_lead_id === leadId) {
        throw new ApiError(
          400,
          "A lead cannot be marked as a duplicate of itself.",
        );
      }
      updatePayload.duplicate_of_lead_id = parsed.duplicate_of_lead_id ?? null;
      if (parsed.duplicate_of_lead_id) {
        await assertDuplicateTargetDoesNotCycle(
          leadId,
          parsed.duplicate_of_lead_id,
        );
        updatePayload.status = "duplicate";
      }
    }

    const { data, error } = await supabase
      .from("lead_inquiries")
      .update(updatePayload)
      .eq("id", leadId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update lead", error.message);
    }
    if (!data) {
      throw new ApiError(404, "Lead not found");
    }

    if (parsed.notes !== undefined && parsed.notes.trim().length > 0) {
      await insertLeadEvent({
        leadId,
        eventType: "note",
        title: "Coordinator note",
        body: parsed.notes.trim(),
        actorProfileId: auth?.profileId ?? null,
      });
    } else {
      await insertLeadEvent({
        leadId,
        eventType: "updated",
        title: "Lead updated",
        actorProfileId: auth?.profileId ?? null,
        payload: updatePayload,
      });
    }

    return loadLeadById(leadId);
  },

  async convert(id: unknown, payload: unknown, auth?: AuthorizationContext) {
    const leadId = leadIdSchema.parse(id);
    const parsed = convertLeadSchema.parse(payload);
    const existingLead = await loadLeadById(leadId);
    const existingTarget = getConvertedLeadTarget(existingLead);
    if (
      (TERMINAL_LEAD_STATUSES as readonly LeadStatus[]).includes(
        existingLead.status,
      )
    ) {
      if (existingLead.status === "converted" && existingTarget) {
        return { lead: existingLead, target: existingTarget };
      }
      throw new ApiError(409, "Lead is already in a terminal status.");
    }

    const supabase = getSupabaseAdmin() as any;
    const { data: claimedLead, error: claimError } = await supabase
      .from("lead_inquiries")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .not("status", "in", `(${TERMINAL_LEAD_STATUSES.join(",")})`)
      .select("*")
      .maybeSingle();

    if (claimError) {
      throw new ApiError(
        500,
        "Failed to claim lead conversion",
        claimError.message,
      );
    }
    if (!claimedLead) {
      const latestLead = await loadLeadById(leadId);
      const latestTarget = getConvertedLeadTarget(latestLead);
      if (latestLead.status === "converted" && latestTarget) {
        return { lead: latestLead, target: latestTarget };
      }
      throw new ApiError(409, "Lead is already in a terminal status.");
    }

    const lead = claimedLead as LeadRecord;
    const firstName =
      lead.first_name ?? splitLeadName(lead.full_name).firstName;
    const lastName = lead.last_name ?? splitLeadName(lead.full_name).lastName;
    const fullName =
      lead.full_name ?? [firstName, lastName].filter(Boolean).join(" ");
    const email = lead.email ?? "unknown@example.invalid";
    const phone = lead.phone ?? "";
    const country = lead.country ?? "Not provided";
    const message = lead.message ?? "Converted from Lead Inbox.";

    let updatePayload: Record<string, unknown> = {};
    let target: Record<string, unknown>;

    try {
      if (parsed.action === "contact_request") {
        const contactRequest = await contactRequestController.create({
          first_name: firstName ?? fullName ?? "Lead",
          last_name: lastName ?? "Inquiry",
          email,
          phone,
          country,
          treatment: lead.procedure_interest ?? undefined,
          message,
          request_type: lead.ready_for_consultation
            ? "consultation"
            : "general",
          notes: parsed.notes,
          assigned_to: lead.assigned_to,
          patient_id: lead.patient_id,
          origin: "manual",
          portal_metadata: {
            leadId: lead.id,
            source: lead.source,
            convertedBy: auth?.profileId ?? null,
          },
        });
        updatePayload = {
          contact_request_id: contactRequest.id,
        };
        target = { type: "contact_request", id: contactRequest.id };
      } else if (parsed.action === "start_journey") {
        const submission = await startJourneySubmissionController.create({
          first_name: firstName ?? fullName ?? "Lead",
          last_name: lastName ?? "Inquiry",
          email,
          phone: phone || "Not provided",
          country,
          treatment_name: lead.procedure_interest ?? undefined,
          medical_condition: message,
          has_medical_records: lead.has_medical_documents,
          language_preference: lead.language ?? undefined,
          patient_id: lead.patient_id,
          origin: "web",
        });
        updatePayload = {
          start_journey_submission_id: submission.id,
        };
        target = { type: "start_journey_submission", id: submission.id };
      } else if (parsed.action === "existing_patient") {
        if (!parsed.patient_id) {
          throw new ApiError(400, "Select an existing patient before linking.");
        }
        updatePayload = { patient_id: parsed.patient_id };
        target = { type: "patient", id: parsed.patient_id, existing: true };
      } else {
        const patient = await patientController.create(
          {
            full_name:
              fullName && fullName.length >= 2 ? fullName : "Lead Inquiry",
            contact_email: lead.email ?? undefined,
            contact_phone: lead.phone ?? undefined,
            nationality: lead.country ?? undefined,
            preferred_language: lead.language ?? undefined,
            notes: [lead.message, parsed.notes].filter(Boolean).join("\n\n"),
            status: "potential",
            source: "staff",
            created_channel: "operations_dashboard",
          },
          auth,
        );
        updatePayload = { patient_id: patient.id };
        target = { type: "patient", id: patient.id, created: true };
      }
    } catch (error) {
      await restoreLeadAfterFailedConversion(existingLead, auth);
      throw error;
    }

    const { error } = await supabase
      .from("lead_inquiries")
      .update(updatePayload)
      .eq("id", leadId);

    if (error) {
      await cleanupConversionTarget(target);
      await restoreLeadAfterFailedConversion(existingLead, auth);
      throw new ApiError(500, "Failed to mark lead converted", error.message);
    }

    await insertLeadEvent({
      leadId,
      eventType: "converted",
      title: "Lead converted",
      body: parsed.notes ?? null,
      actorProfileId: auth?.profileId ?? null,
      payload: target,
    });

    return { lead: await loadLeadById(leadId), target };
  },
};
