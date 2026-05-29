"use server";

import { NextRequest } from "next/server";
import { z } from "zod";
import { contactRequestController } from "@/server/modules/contactRequests/module";
import { consultationSlotController } from "@/server/modules/consultationSlots/module";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { jsonResponse, handleRouteError } from "@/server/utils/http";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";

const travelWindowSchema = z.object({
  from: z.string().min(1, "travel window start is required"),
  to: z.string().nullable().optional(),
});

const consultationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(1, "Please share a phone or WhatsApp number"),
  country: z.string().min(1, "Country of residence is required"),
  treatment: z.string().min(1, "Preferred treatment is required"),
  treatmentId: z.string().optional(),
  procedure: z.string().optional(),
  doctorId: z.string().uuid().optional().nullable(),
  bookingType: z.enum(["onsite", "phone", "video"]).optional(),
  selectedSlotId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().min(12).max(120).optional(),
  destination: z.string().optional(),
  travelWindow: travelWindowSchema,
  healthBackground: z
    .string()
    .min(1, "Health goals or current diagnosis is required"),
  budgetRange: z.string().optional(),
  companions: z.string().optional(),
  medicalReports: z.string().optional(),
  contactPreference: z.string().optional(),
  additionalQuestions: z.string().optional(),
  documents: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal("medical_records"),
        originalName: z.string(),
        storedName: z.string(),
        path: z.string(),
        bucket: z.string(),
        size: z.number().nonnegative(),
        url: z.string().nullable(),
        uploadedAt: z.string(),
      }),
    )
    .optional(),
});

const splitFullName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Prospective", lastName: "Patient" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Patient" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const formatTravelWindow = (window: z.infer<typeof travelWindowSchema>) => {
  if (!window?.from) return "";
  if (!window.to) return window.from;
  return `${window.from} - ${window.to}`;
};

const ensurePatientForUser = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  user: { id: string; email?: string | null },
  payload: z.infer<typeof consultationSchema>,
) => {
  const { data: existingPatient, error: patientError } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!patientError && existingPatient?.id) {
    return existingPatient.id;
  }

  const { data: insertedPatient, error: insertError } = await supabaseAdmin
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: payload.fullName.trim(),
      contact_email: payload.email || user.email || null,
      contact_phone: payload.phone || null,
      nationality: payload.country || null,
      source: "organic",
      created_channel: "api",
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505" || insertError.code === "409") {
      const { data: retryPatient, error: retryError } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!retryError && retryPatient?.id) {
        return retryPatient.id;
      }
    }

    throw insertError;
  }

  return insertedPatient?.id ?? null;
};

const normalizeIdempotencyKey = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= 12 ? trimmed.slice(0, 120) : null;
};

const findExistingSubmission = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  idempotencyKey: string | null,
  email: string,
) => {
  if (!idempotencyKey) return null;

  const { data: existingRequest, error: requestError } = await supabaseAdmin
    .from("contact_requests")
    .select("id, status, email")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (requestError || !existingRequest) {
    return null;
  }

  if (existingRequest.email.toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }

  const { data: existingConsultation } = await supabaseAdmin
    .from("patient_consultations")
    .select("id")
    .eq("contact_request_id", existingRequest.id)
    .maybeSingle();

  return {
    consultationRequestId: existingRequest.id,
    bookedConsultationId: existingConsultation?.id ?? null,
    status: existingRequest.status,
  };
};

export const POST = async (req: NextRequest) => {
  try {
    const supabaseClient = await createSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();
    const payload = consultationSchema.parse(await req.json());

    const authHeader = req.headers.get("authorization");
    let user = null;

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7).trim();
      if (accessToken.length > 0) {
        const { data: tokenUser, error: tokenError } =
          await supabaseAdmin.auth.getUser(accessToken);
        if (!tokenError && tokenUser?.user) {
          user = tokenUser.user;
        }
      }
    }

    if (!user) {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();

      user = session?.user ?? null;

      if (!user && !sessionError) {
        const { data: userResult } = await supabaseClient.auth.getUser();
        user = userResult?.user ?? null;
      }
    }

    const patientId = user
      ? await ensurePatientForUser(supabaseAdmin, user, payload)
      : null;
    const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);
    const existingSubmission = await findExistingSubmission(
      supabaseAdmin,
      idempotencyKey,
      payload.email,
    );

    if (existingSubmission) {
      return jsonResponse({
        success: true,
        consultationRequestId: existingSubmission.consultationRequestId,
        bookedConsultationId: existingSubmission.bookedConsultationId,
        booked: Boolean(existingSubmission.bookedConsultationId),
        duplicate: true,
        notificationQueued: false,
        status: existingSubmission.status,
      });
    }

    const { firstName, lastName } = splitFullName(payload.fullName);
    const travelWindow = formatTravelWindow(payload.travelWindow);

    const healthBackground = payload.healthBackground.trim();
    const documents = payload.documents ?? [];
    const documentNames = documents
      .map((doc) => doc.originalName)
      .filter((name) => typeof name === "string" && name.length > 0);
    const attachmentsSummary =
      documentNames.length > 0 ? documentNames.join(", ") : null;

    const portalMetadata =
      payload.treatmentId ||
      payload.procedure ||
      payload.doctorId ||
      payload.bookingType ||
      payload.selectedSlotId
        ? {
            ...(payload.treatmentId
              ? { treatmentId: payload.treatmentId }
              : {}),
            ...(payload.procedure ? { procedure: payload.procedure } : {}),
            ...(payload.doctorId ? { doctorId: payload.doctorId } : {}),
            ...(payload.bookingType
              ? { bookingType: payload.bookingType }
              : {}),
            ...(payload.selectedSlotId
              ? {
                  selectedSlotId: payload.selectedSlotId,
                  selectedSlotStatus: "requested",
                }
              : {}),
          }
        : undefined;

    const consultationRequest = await contactRequestController.create({
      first_name: firstName,
      last_name: lastName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      treatment: payload.treatment,
      destination: payload.destination,
      travel_window: travelWindow,
      health_background: healthBackground,
      budget_range: payload.budgetRange,
      companions: payload.companions,
      medical_reports:
        payload.medicalReports ?? attachmentsSummary ?? undefined,
      contact_preference: payload.contactPreference,
      additional_questions: payload.additionalQuestions,
      message: healthBackground,
      idempotency_key: idempotencyKey ?? undefined,
      request_type: "consultation",
      user_id: user?.id ?? null,
      patient_id: patientId,
      origin: user ? "portal" : undefined,
      portal_metadata: portalMetadata,
      documents: documents.length > 0 ? documents : null,
    });

    let bookedConsultationId: string | null = null;
    if (payload.selectedSlotId && user && patientId) {
      const bookedConsultation = await consultationSlotController.book({
        slot_id: payload.selectedSlotId,
        patient_id: patientId,
        user_id: user.id,
        contact_request_id: consultationRequest.id,
        notes: payload.additionalQuestions,
      });
      bookedConsultationId = bookedConsultation.id;
    }

    const { error: emailError } = await supabaseAdmin.functions.invoke(
      "send-contact-email",
      {
        body: {
          firstName,
          lastName,
          email: payload.email,
          phone: payload.phone,
          country: payload.country,
          treatment: payload.treatment,
          procedure: payload.procedure,
          doctorId: payload.doctorId,
          bookingType: payload.bookingType,
          selectedSlotId: payload.selectedSlotId,
          bookedConsultationId,
          destination: payload.destination,
          travelWindow,
          healthBackground,
          message: healthBackground,
          budgetRange: payload.budgetRange,
          companions: payload.companions,
          medicalReports: payload.medicalReports,
          contactPreference: payload.contactPreference,
          additionalQuestions: payload.additionalQuestions,
          attachmentsSummary,
          documents,
          requestType: "consultation",
          portalMetadata,
          skipLogging: true,
        },
      },
    );

    if (emailError) {
      console.error(
        "[consultations] request saved but notification email failed",
        emailError,
      );
    }

    return jsonResponse({
      success: true,
      consultationRequestId: consultationRequest.id,
      bookedConsultationId,
      booked: Boolean(bookedConsultationId),
      duplicate: false,
      notificationQueued: !emailError,
      status: consultationRequest.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
};
