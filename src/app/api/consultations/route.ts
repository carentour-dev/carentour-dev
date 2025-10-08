"use server";

import { NextRequest } from "next/server";
import { z } from "zod";
import { contactRequestController } from "@/server/modules/contactRequests/module";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { jsonResponse, handleRouteError } from "@/server/utils/http";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";

const consultationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(1, "Please share a phone or WhatsApp number"),
  country: z.string().min(1, "Country of residence is required"),
  treatment: z.string().min(1, "Preferred treatment is required"),
  treatmentId: z.string().optional(),
  procedure: z.string().optional(),
  destination: z.string().optional(),
  travelWindow: z.string().min(1, "Please share your ideal travel window"),
  healthBackground: z.string().min(1, "Health goals or current diagnosis is required"),
  budgetRange: z.string().optional(),
  companions: z.string().optional(),
  medicalReports: z.string().optional(),
  contactPreference: z.string().optional(),
  additionalQuestions: z.string().optional(),
});

const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
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

export const POST = async (req: NextRequest) => {
  try {
    const supabaseClient = await createSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");
    let user = null;

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7).trim();
      if (accessToken.length > 0) {
        const { data: tokenUser, error: tokenError } = await supabaseAdmin.auth.getUser(accessToken);
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

    let patientId: string | null = null;

    if (user?.id) {
      const { data: existingPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!patientError && existingPatient?.id) {
        patientId = existingPatient.id;
      }
    }

    const payload = consultationSchema.parse(await req.json());
    const { firstName, lastName } = splitFullName(payload.fullName);

    const healthBackground = payload.healthBackground.trim();

    const portalMetadata =
      payload.treatmentId || payload.procedure
        ? {
            ...(payload.treatmentId ? { treatmentId: payload.treatmentId } : {}),
            ...(payload.procedure ? { procedure: payload.procedure } : {}),
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
      travel_window: payload.travelWindow,
      health_background: healthBackground,
      budget_range: payload.budgetRange,
      companions: payload.companions,
      medical_reports: payload.medicalReports,
      contact_preference: payload.contactPreference,
      additional_questions: payload.additionalQuestions,
      message: healthBackground,
      request_type: "consultation",
      user_id: user?.id ?? null,
      patient_id: patientId,
      origin: user ? "portal" : undefined,
      portal_metadata: portalMetadata,
    });

    const { error: emailError } = await supabaseAdmin.functions.invoke("send-contact-email", {
      body: {
        firstName,
        lastName,
        email: payload.email,
        phone: payload.phone,
        country: payload.country,
        treatment: payload.treatment,
        procedure: payload.procedure,
        destination: payload.destination,
        travelWindow: payload.travelWindow,
        healthBackground,
        message: healthBackground,
        budgetRange: payload.budgetRange,
        companions: payload.companions,
        medicalReports: payload.medicalReports,
        contactPreference: payload.contactPreference,
        additionalQuestions: payload.additionalQuestions,
        requestType: "consultation",
        portalMetadata,
        skipLogging: true,
      },
    });

    if (emailError) {
      throw emailError;
    }

    return jsonResponse({
      success: true,
      consultationRequestId: consultationRequest.id,
      status: consultationRequest.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
};
