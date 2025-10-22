"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type ContactRequestRow =
  Database["public"]["Tables"]["contact_requests"]["Row"];
type ConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"];
type AppointmentRow =
  Database["public"]["Tables"]["patient_appointments"]["Row"];
type DoctorReviewRow = Database["public"]["Tables"]["doctor_reviews"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];
type PatientStoryRow = Database["public"]["Tables"]["patient_stories"]["Row"];

export type PatientConsultation = ConsultationRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  contact_requests?: Pick<
    ContactRequestRow,
    "id" | "status" | "request_type" | "origin"
  > | null;
};

export type PatientAppointment = AppointmentRow & {
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

export type PatientReview = DoctorReviewRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  treatments?: Pick<TreatmentRow, "id" | "name" | "slug"> | null;
};

export type PatientStory = PatientStoryRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "avatar_url"> | null;
  treatments?: Pick<TreatmentRow, "id" | "name" | "slug"> | null;
};

export interface PatientPortalSnapshot {
  patient: PatientRow;
  requests: ContactRequestRow[];
  consultations: PatientConsultation[];
  appointments: PatientAppointment[];
  reviews: PatientReview[];
  stories: PatientStory[];
}

const buildFallbackName = (user: ReturnType<typeof useAuth>["user"]) => {
  if (!user) return "Care N Tour Patient";
  const raw =
    (typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.username === "string" &&
          user.user_metadata.username.trim().length > 0
        ? user.user_metadata.username
        : typeof user.email === "string"
          ? user.email.split("@")[0]
          : null) ?? "Care N Tour Patient";

  const cleaned = raw.trim().replace(/\s+/g, " ");
  return cleaned.length > 1 ? cleaned : "Care N Tour Patient";
};

const allowedSexValues = new Set([
  "female",
  "male",
  "non_binary",
  "prefer_not_to_say",
]);

const metadataString = (
  metadata: Record<string, unknown>,
  key: string,
): string => {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
};

const parseDate = (value: string): string | null => {
  if (value.length === 0) return null;
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return value.includes("T")
    ? (candidate.toISOString().split("T")[0] ?? null)
    : value;
};

const normalizeSex = (value: string): string | null => {
  if (!allowedSexValues.has(value)) {
    return null;
  }
  return value;
};

const fetchPatientRecord = async (userId: string) => {
  return supabase
    .from("patients")
    .select(
      "id, user_id, full_name, contact_email, contact_phone, preferred_language, preferred_currency, nationality, has_testimonial, email_verified, date_of_birth, home_city, travel_year, notes, sex, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
};

const ensurePatientRecord = async (
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): Promise<PatientRow> => {
  const { data, error } = await fetchPatientRecord(user.id);

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message ?? "Failed to look up patient record");
  }

  if (data) {
    return data;
  }

  const fallbackName = buildFallbackName(user);
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFullName = metadataString(userMetadata, "full_name");
  const metadataNationality = metadataString(userMetadata, "nationality");
  const metadataPhone = metadataString(userMetadata, "phone");
  const metadataSex = normalizeSex(metadataString(userMetadata, "sex"));
  const metadataDateOfBirth = parseDate(
    metadataString(userMetadata, "date_of_birth"),
  );
  const metadataPreferredLanguage = metadataString(
    userMetadata,
    "preferred_language",
  );
  const metadataPreferredCurrency = metadataString(
    userMetadata,
    "preferred_currency",
  );

  const { data: inserted, error: insertError } = await supabase
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: metadataFullName.length > 0 ? metadataFullName : fallbackName,
      contact_email: user.email ?? null,
      contact_phone: metadataPhone.length > 0 ? metadataPhone : null,
      nationality: metadataNationality.length > 0 ? metadataNationality : null,
      sex: metadataSex,
      date_of_birth: metadataDateOfBirth,
      preferred_language:
        metadataPreferredLanguage.length > 0 ? metadataPreferredLanguage : null,
      preferred_currency:
        metadataPreferredCurrency.length > 0 ? metadataPreferredCurrency : null,
    })
    .select(
      "id, user_id, full_name, contact_email, contact_phone, preferred_language, preferred_currency, nationality, has_testimonial, email_verified, date_of_birth, home_city, travel_year, notes, sex, created_at, updated_at",
    )
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505" || insertError.code === "409") {
      // Another request created the record concurrently. Re-fetch.
      const retry = await fetchPatientRecord(user.id);
      if (retry.error) {
        throw new Error(
          retry.error.message ?? "Failed to fetch existing patient record",
        );
      }
      if (!retry.data) {
        throw new Error("Patient record exists but could not be loaded");
      }
      return retry.data;
    }
    throw new Error(insertError.message ?? "Failed to create patient record");
  }

  if (!inserted) {
    const retry = await fetchPatientRecord(user.id);
    if (retry.error) {
      throw new Error(retry.error.message ?? "Failed to fetch patient record");
    }
    if (!retry.data) {
      throw new Error("Patient record was not created");
    }
    return retry.data;
  }

  return inserted;
};

const fetchPatientPortalSnapshot = async (
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
) => {
  const patient = await ensurePatientRecord(user);

  const [requests, consultations, appointments, reviews, stories] =
    await Promise.all([
      supabase
        .from("contact_requests")
        .select(
          "id, user_id, patient_id, first_name, last_name, email, phone, country, treatment, message, status, request_type, notes, origin, travel_window, health_background, budget_range, companions, created_at, updated_at, resolved_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_consultations")
        .select(
          "id, patient_id, user_id, contact_request_id, doctor_id, status, scheduled_at, duration_minutes, timezone, location, meeting_url, notes, created_at, updated_at, doctors(id, name, title, avatar_url), contact_requests(id, status, request_type, origin)",
        )
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("patient_appointments")
        .select(
          "id, patient_id, user_id, doctor_id, facility_id, consultation_id, title, appointment_type, status, starts_at, ends_at, timezone, location, pre_visit_instructions, notes, created_at, updated_at, doctors(id, name, title, avatar_url), service_provider:service_providers(id, name, facility_type), patient_consultations(id, scheduled_at, status)",
        )
        .eq("patient_id", patient.id)
        .order("starts_at", { ascending: true }),
      supabase
        .from("doctor_reviews")
        .select(
          "id, doctor_id, treatment_id, patient_id, rating, review_text, recovery_time, is_verified, published, created_at, updated_at, doctors(id, name, title, avatar_url), treatments(id, name, slug)",
        )
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_stories")
        .select(
          "id, patient_id, doctor_id, treatment_id, headline, excerpt, body_markdown, hero_image, locale, published, featured, display_order, created_at, updated_at, doctors(id, name, title, avatar_url), treatments(id, name, slug)",
        )
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
    ]);

  const requestError = requests.error;
  if (requestError) {
    throw new Error(requestError.message ?? "Failed to load contact requests");
  }

  const consultationsError = consultations.error;
  if (consultationsError) {
    throw new Error(
      consultationsError.message ?? "Failed to load consultations",
    );
  }

  const appointmentsError = appointments.error;
  if (appointmentsError) {
    throw new Error(appointmentsError.message ?? "Failed to load appointments");
  }

  const reviewsError = reviews.error;
  if (reviewsError) {
    throw new Error(reviewsError.message ?? "Failed to load reviews");
  }

  const storiesError = stories.error;
  if (storiesError) {
    throw new Error(storiesError.message ?? "Failed to load stories");
  }

  return {
    patient,
    requests: requests.data ?? [],
    consultations: (consultations.data ?? []) as PatientConsultation[],
    appointments: (appointments.data ?? []) as PatientAppointment[],
    reviews: (reviews.data ?? []) as PatientReview[],
    stories: (stories.data ?? []) as PatientStory[],
  };
};

export const usePatientPortalData = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["patient-portal", user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchPatientPortalSnapshot(user!),
    staleTime: 60 * 1000,
  });

  const snapshot = query.data;

  return {
    data: snapshot,
    patient: snapshot?.patient ?? null,
    requests: snapshot?.requests ?? [],
    consultations: snapshot?.consultations ?? [],
    appointments: snapshot?.appointments ?? [],
    reviews: snapshot?.reviews ?? [],
    stories: snapshot?.stories ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};
