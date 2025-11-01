import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PatientReview = {
  id: string;
  patient_id: string | null;
  patient_name: string;
  patient_country: string | null;
  doctor_id?: string | null;
  treatment_id: string;
  treatment_slug: string | null;
  treatment_name?: string | null;
  procedure_name: string | null;
  rating: number;
  review_text: string;
  recovery_time: string | null;
  highlight: boolean | null;
  locale: string | null;
  created_at: string;
};

export type PatientStory = {
  id: string;
  patient_id: string | null;
  treatment_id: string;
  treatment_slug: string | null;
  treatment_name?: string | null;
  headline: string;
  excerpt: string | null;
  body_markdown: string;
  hero_image: string | null;
  featured: boolean | null;
  locale: string | null;
  created_at: string;
  patient_name?: string | null;
  doctor_name?: string | null;
};

interface ReviewQuery {
  treatmentId?: string;
  treatmentSlug?: string;
  highlightOnly?: boolean;
  limit?: number;
}

const fetchReviews = async ({
  treatmentId,
  treatmentSlug,
  highlightOnly,
  limit,
}: ReviewQuery): Promise<PatientReview[]> => {
  let query = supabase
    .from("doctor_reviews")
    .select(
      "id, patient_id, patient_name, patient_country, doctor_id, treatment_id, procedure_name, rating, review_text, recovery_time, highlight, locale, created_at, treatments(slug, name)",
    )
    .eq("published", true)
    .order("highlight", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (treatmentId) {
    query = query.eq("treatment_id", treatmentId);
  } else if (treatmentSlug) {
    query = query.eq("treatments.slug", treatmentSlug);
  }

  if (highlightOnly) {
    query = query.eq("highlight", true);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((review: any) => {
    const mapped = {
      ...review,
      treatment_slug: review.treatments?.slug ?? null,
      treatment_name: review.treatments?.name ?? null,
    };
    delete (mapped as any).treatments;
    return mapped;
  });
};

interface StoryQuery {
  treatmentId?: string;
  treatmentSlug?: string;
  featuredOnly?: boolean;
  limit?: number;
}

const fetchStories = async ({
  treatmentId,
  treatmentSlug,
  featuredOnly,
  limit,
}: StoryQuery): Promise<PatientStory[]> => {
  let query = supabase
    .from("patient_stories")
    .select(
      "id, patient_id, treatment_id, headline, excerpt, body_markdown, hero_image, featured, locale, created_at, patients(full_name), doctors(name), treatments(slug, name)",
    )
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (treatmentId) {
    query = query.eq("treatment_id", treatmentId);
  } else if (treatmentSlug) {
    query = query.eq("treatments.slug", treatmentSlug);
  }

  if (featuredOnly) {
    query = query.eq("featured", true);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((story: any) => {
    const mapped = {
      ...story,
      treatment_slug: story.treatments?.slug ?? null,
      treatment_name: story.treatments?.name ?? null,
    };
    delete (mapped as any).treatments;
    return mapped;
  });
};

type ReviewHookParams = {
  treatmentId?: string;
  treatmentSlug?: string;
  highlightOnly?: boolean;
  limit?: number;
};

export const usePatientReviews = (params?: ReviewHookParams) => {
  const treatmentId = params?.treatmentId;
  const treatmentSlug = params?.treatmentSlug;
  const highlightOnly = params?.highlightOnly ?? false;
  const limit = params?.limit;

  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "patient-reviews",
      treatmentId ?? null,
      treatmentSlug ?? null,
      highlightOnly,
      limit ?? null,
    ],
    queryFn: () =>
      fetchReviews({
        treatmentId,
        treatmentSlug,
        highlightOnly,
        limit,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    reviews,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};

type StoryHookParams = {
  treatmentId?: string;
  treatmentSlug?: string;
  featuredOnly?: boolean;
  limit?: number;
};

export const usePatientStories = (params?: StoryHookParams) => {
  const treatmentId = params?.treatmentId;
  const treatmentSlug = params?.treatmentSlug;
  const featuredOnly = params?.featuredOnly ?? false;
  const limit = params?.limit;

  const {
    data: stories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "patient-stories",
      treatmentId ?? null,
      treatmentSlug ?? null,
      featuredOnly,
      limit ?? null,
    ],
    queryFn: () =>
      fetchStories({
        treatmentId,
        treatmentSlug,
        featuredOnly,
        limit,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    stories,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
