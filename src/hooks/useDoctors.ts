import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
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

interface DoctorReview {
  id: string;
  patient_name: string;
  patient_country: string;
  procedure_name: string;
  rating: number;
  review_text: string;
  recovery_time: string;
  is_verified: boolean;
  created_at: string;
}

const fetchDoctors = async (treatmentCategory?: string): Promise<Doctor[]> => {
  let query = supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true);

  if (treatmentCategory) {
    // Join with doctor_treatments to filter by treatment category
    query = supabase
      .from('doctors')
      .select(`
        *,
        doctor_treatments!inner(treatment_category)
      `)
      .eq('is_active', true)
      .eq('doctor_treatments.treatment_category', treatmentCategory);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
};

export const useDoctors = (treatmentCategory?: string) => {
  const { data: doctors = [], isLoading: loading, error } = useQuery({
    queryKey: ['doctors', treatmentCategory],
    queryFn: () => fetchDoctors(treatmentCategory),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
  });

  return {
    doctors,
    loading,
    error: error instanceof Error ? error.message : null
  };
};

const fetchDoctorReviews = async (doctorId: string): Promise<DoctorReview[]> => {
  const { data, error } = await supabase
    .from('doctor_reviews')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
};

export const useDoctorReviews = (doctorId: string) => {
  const { data: reviews = [], isLoading: loading, error } = useQuery({
    queryKey: ['doctor-reviews', doctorId],
    queryFn: () => fetchDoctorReviews(doctorId),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    enabled: !!doctorId, // Only run query if doctorId is provided
  });

  return {
    reviews,
    loading,
    error: error instanceof Error ? error.message : null
  };
};