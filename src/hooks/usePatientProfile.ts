import { useQuery } from "@tanstack/react-query";

export interface PatientProfile {
  patient_id: string;
  full_name: string;
  nationality: string | null;
  home_city: string | null;
  travel_year: number | null;
  has_testimonial: boolean | null;
  created_at: string;
  updated_at: string;
  reviews: Array<{
    id: string;
    patient_name: string;
    patient_country: string | null;
    doctor_id: string | null;
    doctor_name: string | null;
    doctor_title: string | null;
    doctor_avatar_url: string | null;
    treatment_slug: string | null;
    treatment_name: string | null;
    procedure_name: string | null;
    rating: number;
    review_text: string;
    recovery_time: string | null;
    is_verified: boolean | null;
    published: boolean | null;
    highlight: boolean | null;
    display_order: number | null;
    media: any;
    locale: string | null;
    created_at: string;
    updated_at: string;
  }>;
  stories: Array<{
    id: string;
    patient_id: string | null;
    patient_name: string | null;
    doctor_id: string | null;
    doctor_name: string | null;
    doctor_title: string | null;
    doctor_avatar_url: string | null;
    treatment_slug: string;
    treatment_name: string | null;
    headline: string;
    excerpt: string | null;
    body_markdown: string;
    outcome_summary: any;
    media: any;
    hero_image: string | null;
    locale: string | null;
    published: boolean | null;
    featured: boolean | null;
    display_order: number | null;
    created_at: string;
    updated_at: string;
  }>;
  published_review_count: number;
  published_story_count: number;
}

const fetchPatientProfile = async (patientId: string): Promise<PatientProfile> => {
  const response = await fetch(`/api/patients/${patientId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch patient profile");
  }

  return response.json();
};

export const usePatientProfile = (patientId?: string | null) => {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["patient-profile", patientId],
    queryFn: () => fetchPatientProfile(patientId!),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    profile,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
