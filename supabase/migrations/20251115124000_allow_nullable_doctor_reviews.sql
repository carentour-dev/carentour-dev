-- Allow patient reviews to omit a specific doctor as long as a treatment slug is provided.
ALTER TABLE public.doctor_reviews
  ALTER COLUMN doctor_id DROP NOT NULL;
