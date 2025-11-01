import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";
import { handleRouteError } from "@/server/utils/http";

const documentSchema = z.object({
  id: z.string(),
  type: z.enum(["passport", "medical_records", "insurance", "other"]),
  originalName: z.string(),
  storedName: z.string(),
  path: z.string(),
  bucket: z.string(),
  size: z.number(),
  url: z.string().nullable(),
  uploadedAt: z.string(),
});

const travelWindowSchema = z
  .object({
    from: z.string().min(1, "travel window start is required"),
    to: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const startJourneySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.string().optional(),
  country: z.string().min(1),
  treatmentId: z.string().min(1),
  treatmentName: z.string().optional(),
  procedureId: z.string().optional(),
  timeline: z.string().optional(),
  budgetRange: z.string().optional(),
  medicalCondition: z.string().min(10),
  previousTreatments: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  doctorPreference: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  travelDates: travelWindowSchema,
  accommodationType: z.string().optional(),
  companionTravelers: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  languagePreference: z.string().optional(),
  languageNotes: z.string().optional(),
  hasInsurance: z.boolean().optional(),
  hasPassport: z.boolean().optional(),
  hasMedicalRecords: z.boolean().optional(),
  consultationMode: z.enum(["video", "phone"]).nullable().optional(),
  documents: z.array(documentSchema).optional(),
});

const formatTravelWindow = (window: z.infer<typeof travelWindowSchema>) => {
  if (!window || !window.from) return null;
  if (!window.to) return window.from;
  return `${window.from} - ${window.to}`;
};

type AuthenticatedUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
} | null;

type PatientSummary = {
  id: string;
  full_name: string;
} | null;

type StartJourneyPayload = z.infer<typeof startJourneySchema>;

const buildMessage = (payload: StartJourneyPayload) => {
  const sections: string[] = [
    `Medical Condition:\n${payload.medicalCondition}`,
  ];

  if (payload.previousTreatments) {
    sections.push(`Previous Treatments:\n${payload.previousTreatments}`);
  }
  if (payload.currentMedications) {
    sections.push(`Current Medications:\n${payload.currentMedications}`);
  }
  if (payload.allergies) {
    sections.push(`Allergies:\n${payload.allergies}`);
  }
  if (payload.dietaryRequirements) {
    sections.push(`Dietary Requirements:\n${payload.dietaryRequirements}`);
  }
  if (payload.doctorPreference) {
    sections.push(`Doctor/Hospital Preferences:\n${payload.doctorPreference}`);
  }
  if (payload.accessibilityNeeds) {
    sections.push(`Accessibility Needs:\n${payload.accessibilityNeeds}`);
  }

  return sections.join("\n\n");
};

const resolveUserAndPatient = async (
  req: NextRequest,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
) => {
  const supabaseClient = await createSupabaseClient();
  const authHeader = req.headers.get("authorization");
  let user: AuthenticatedUser = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      const { data: tokenUser, error } =
        await supabaseAdmin.auth.getUser(token);
      if (!error && tokenUser?.user) {
        user = tokenUser.user;
      }
    }
  }

  if (!user) {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();
    if (!sessionError && session?.user) {
      user = session.user;
    } else {
      const { data } = await supabaseClient.auth.getUser();
      user = data?.user ?? null;
    }
  }

  let patient: PatientSummary = null;
  if (user?.id) {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data?.id && data?.full_name) {
      patient = data;
    }
  }

  return { user, patient };
};

export async function POST(req: NextRequest) {
  try {
    const payload = startJourneySchema.parse(await req.json());

    const supabaseAdmin = getSupabaseAdmin();
    const { user, patient } = await resolveUserAndPatient(req, supabaseAdmin);

    const [{ data: treatment }, { data: procedure }] = await Promise.all([
      supabaseAdmin
        .from("treatments")
        .select("id, name")
        .eq("id", payload.treatmentId)
        .maybeSingle(),
      payload.procedureId
        ? supabaseAdmin
            .from("treatment_procedures")
            .select("id, name")
            .eq("id", payload.procedureId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const treatmentName = treatment?.name ?? payload.treatmentName ?? "";
    const procedureName = procedure?.name ?? null;
    const combinedTreatment = [treatmentName, procedureName]
      .filter(Boolean)
      .join(" — ");

    const message = buildMessage(payload);
    const travelWindow = formatTravelWindow(payload.travelDates);

    const documents = payload.documents ?? [];
    const medicalRecordUploads = documents.filter(
      (doc) => doc.type === "medical_records",
    );
    const medicalReportsSummary =
      medicalRecordUploads.length > 0
        ? medicalRecordUploads.map((doc) => doc.originalName).join(", ")
        : payload.hasMedicalRecords
          ? "Patient will provide later"
          : null;

    const languageNotes = payload.languageNotes?.trim() ?? null;

    const portalMetadata = {
      intakeType: "start_journey",
      treatment: {
        id: payload.treatmentId,
        name: treatmentName,
        procedureId: payload.procedureId ?? null,
        procedureName,
      },
      timeline: payload.timeline ?? null,
      budgetRange: payload.budgetRange ?? null,
      travelDates: payload.travelDates ?? null,
      accommodationType: payload.accommodationType ?? null,
      companionTravelers: payload.companionTravelers ?? null,
      dietaryRequirements: payload.dietaryRequirements ?? null,
      languagePreference: payload.languagePreference ?? null,
      languageNotes,
      consultationMode: payload.consultationMode ?? null,
      hasInsurance: payload.hasInsurance ?? false,
      hasPassport: payload.hasPassport ?? false,
      hasMedicalRecords: payload.hasMedicalRecords ?? false,
      age: payload.age ?? null,
      documents: documents,
      notes: {
        previousTreatments: payload.previousTreatments ?? null,
        currentMedications: payload.currentMedications ?? null,
        allergies: payload.allergies ?? null,
        doctorPreference: payload.doctorPreference ?? null,
        accessibilityNeeds: payload.accessibilityNeeds ?? null,
        languageNotes,
      },
    };

    const submission = await startJourneySubmissionController.create({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      age: payload.age,
      country: payload.country,
      treatment_id: payload.treatmentId,
      treatment_name: treatmentName,
      procedure_id: payload.procedureId ?? null,
      procedure_name: procedureName,
      timeline: payload.timeline,
      budget_range: payload.budgetRange,
      medical_condition: payload.medicalCondition,
      previous_treatments: payload.previousTreatments,
      current_medications: payload.currentMedications,
      allergies: payload.allergies,
      doctor_preference: payload.doctorPreference,
      accessibility_needs: payload.accessibilityNeeds,
      travel_dates: payload.travelDates,
      accommodation_type: payload.accommodationType,
      companion_travelers: payload.companionTravelers,
      dietary_requirements: payload.dietaryRequirements,
      language_preference: payload.languagePreference,
      language_notes: languageNotes,
      has_insurance: payload.hasInsurance,
      has_passport: payload.hasPassport,
      has_medical_records: payload.hasMedicalRecords,
      documents: documents,
      consultation_mode: payload.consultationMode,
      user_id: user?.id ?? null,
      patient_id: patient?.id ?? null,
      origin: user ? "portal" : "web",
    });

    // Fire-and-forget email notification. Errors are logged but do not surface.
    try {
      await supabaseAdmin.functions.invoke("send-contact-email", {
        body: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          country: payload.country,
          treatment: combinedTreatment || treatmentName,
          treatmentId: payload.treatmentId,
          procedureId: payload.procedureId,
          procedure: procedureName,
          travelWindow,
          healthBackground: payload.medicalCondition,
          message,
          budgetRange: payload.budgetRange,
          companions: payload.companionTravelers,
          medicalReports: medicalReportsSummary,
          contactPreference: payload.consultationMode,
          additionalQuestions: payload.doctorPreference,
          languagePreference: payload.languagePreference,
          languageNotes,
          requestType: "start_journey",
          portalMetadata,
          skipLogging: true,
        },
      });
    } catch (error) {
      console.warn("Failed to trigger start journey notification", error);
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
