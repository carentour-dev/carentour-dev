import { useQuery } from "@tanstack/react-query";
import type { PublicLocale } from "@/i18n/routing";
import {
  normalizeDoctorForClient,
  type LocalizedPublicDoctor,
} from "@/lib/doctors";

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialization: string;
  bio?: string;
  experience_years: number;
  education: string;
  languages: string[];
  avatar_url?: string;
  achievements: string[];
  certifications: string[];
  research_publications: number;
  successful_procedures: number;
  patient_rating: number;
  total_reviews: number;
}

type UseDoctorsOptions = {
  enabled?: boolean;
  initialData?: Doctor[];
  locale?: PublicLocale;
};

interface DoctorReview {
  id: string;
  patient_name: string;
  patient_country: string | null;
  treatment_id: string;
  treatment_slug: string | null;
  treatment_name?: string | null;
  procedure_name: string | null;
  rating: number;
  review_text: string;
  recovery_time: string | null;
  is_verified: boolean;
  created_at: string;
}

const fetchDoctors = async (
  locale: PublicLocale,
  treatmentCategory?: string,
): Promise<Doctor[]> => {
  const params = new URLSearchParams();
  params.set("locale", locale);

  if (treatmentCategory) {
    params.set("treatmentCategory", treatmentCategory);
  }

  const response = await fetch(`/api/doctors?${params.toString()}`, {
    credentials: "same-origin",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load doctors");
  }

  return ((payload?.data ?? []) as LocalizedPublicDoctor[]).map(
    normalizeDoctorForClient,
  );
};

export const useDoctors = (
  treatmentCategory?: string,
  options?: UseDoctorsOptions,
) => {
  const locale = options?.locale ?? "en";
  const {
    data: doctors = [],
    isLoading: loading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["doctors", locale, treatmentCategory],
    queryFn: () => fetchDoctors(locale, treatmentCategory),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? 0 : undefined,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
  });

  return {
    doctors,
    loading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
};

const fetchDoctorReviews = async (
  doctorId: string,
  locale: PublicLocale,
): Promise<DoctorReview[]> => {
  const response = await fetch(
    `/api/doctors/${doctorId}/reviews?locale=${locale}`,
    {
      credentials: "same-origin",
    },
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load doctor reviews");
  }

  return (payload?.data ?? []) as DoctorReview[];
};

export const useDoctorReviews = (
  doctorId: string,
  locale: PublicLocale = "en",
) => {
  const {
    data: reviews = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["doctor-reviews", locale, doctorId],
    queryFn: () => fetchDoctorReviews(doctorId, locale),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    enabled: !!doctorId, // Only run query if doctorId is provided
  });

  return {
    reviews,
    loading,
    error: error instanceof Error ? error.message : null,
  };
};
