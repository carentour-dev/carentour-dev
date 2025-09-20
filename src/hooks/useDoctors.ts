import { useState, useEffect } from 'react';
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

export const useDoctors = (treatmentCategory?: string) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
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

        setDoctors(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [treatmentCategory]);

  return { doctors, loading, error };
};

export const useDoctorReviews = (doctorId: string) => {
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('doctor_reviews')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [doctorId]);

  return { reviews, loading, error };
};