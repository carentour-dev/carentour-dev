BEGIN;

-- Drop dependent views before restructuring testimonial tables.
DROP VIEW IF EXISTS public.patient_testimonial_public;
DROP VIEW IF EXISTS public.patient_testimonial_rollup;

-- Add treatment_id foreign keys to reviews and stories.
ALTER TABLE public.doctor_reviews ADD COLUMN treatment_id UUID;
ALTER TABLE public.patient_stories ADD COLUMN treatment_id UUID;

-- Backfill treatment IDs using existing slugs.
UPDATE public.doctor_reviews dr
SET treatment_id = t.id
FROM public.treatments t
WHERE dr.treatment_slug IS NOT NULL AND t.slug = dr.treatment_slug;

UPDATE public.patient_stories ps
SET treatment_id = t.id
FROM public.treatments t
WHERE t.slug = ps.treatment_slug;

-- Ensure every testimonial can reference a treatment; create a fallback if needed.
DO $$
DECLARE
  fallback_id UUID;
  fallback_doctor UUID;
BEGIN
  SELECT id INTO fallback_id FROM public.treatments WHERE slug = 'general-care';

  IF fallback_id IS NULL THEN
    INSERT INTO public.treatments (name, slug, is_active)
      VALUES ('General Care', 'general-care', true)
      RETURNING id INTO fallback_id;
  END IF;

  UPDATE public.doctor_reviews
  SET treatment_id = fallback_id
  WHERE treatment_id IS NULL;

  UPDATE public.patient_stories
  SET treatment_id = fallback_id
  WHERE treatment_id IS NULL;

  SELECT id INTO fallback_doctor FROM public.doctors WHERE name = 'Care N Tour Specialist';

  IF fallback_doctor IS NULL THEN
    INSERT INTO public.doctors (
      name,
      title,
      specialization,
      bio,
      experience_years,
      education,
      languages,
      achievements,
      certifications,
      research_publications,
      successful_procedures,
      patient_rating,
      total_reviews,
      is_active
    )
    VALUES (
      'Care N Tour Specialist',
      'Consulting Physician',
      'Comprehensive Medical Care',
      'Placeholder physician used when legacy reviews lack a specific doctor reference.',
      10,
      'General Medical Training',
      ARRAY['English'],
      ARRAY[]::text[],
      ARRAY[]::text[],
      0,
      0,
      0,
      0,
      false
    ) RETURNING id INTO fallback_doctor;
  END IF;

  UPDATE public.doctor_reviews
  SET doctor_id = fallback_doctor
  WHERE doctor_id IS NULL;
END
$$;

-- Enforce presence of treatment references.
ALTER TABLE public.doctor_reviews
  ALTER COLUMN treatment_id SET NOT NULL;

ALTER TABLE public.patient_stories
  ALTER COLUMN treatment_id SET NOT NULL;

-- Wire up foreign keys.
ALTER TABLE public.doctor_reviews
  ADD CONSTRAINT doctor_reviews_treatment_id_fkey
    FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE RESTRICT;

ALTER TABLE public.patient_stories
  ADD CONSTRAINT patient_stories_treatment_id_fkey
    FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE RESTRICT;

-- Require both doctor and treatment on reviews so they appear in respective pages.
ALTER TABLE public.doctor_reviews
  DROP CONSTRAINT IF EXISTS doctor_reviews_requires_reference;

ALTER TABLE public.doctor_reviews
  ADD CONSTRAINT doctor_reviews_requires_reference
    CHECK (doctor_id IS NOT NULL AND treatment_id IS NOT NULL);

-- Retire slug columns in favour of FK lookups.
DROP INDEX IF EXISTS idx_doctor_reviews_treatment_slug;
ALTER TABLE public.doctor_reviews DROP COLUMN IF EXISTS treatment_slug;
ALTER TABLE public.patient_stories DROP COLUMN IF EXISTS treatment_slug;

-- Helpful indexes for new FK lookups.
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_treatment_id ON public.doctor_reviews(treatment_id);
CREATE INDEX IF NOT EXISTS idx_patient_stories_treatment_id ON public.patient_stories(treatment_id);

-- Recreate rollup view using treatment IDs.
CREATE OR REPLACE VIEW public.patient_testimonial_rollup AS
SELECT
  p.id AS patient_id,
  p.user_id,
  p.full_name,
  p.contact_email,
  p.contact_phone,
  p.date_of_birth,
  p.sex,
  p.nationality,
  p.preferred_language,
  p.preferred_currency,
  p.home_city,
  p.travel_year,
  p.has_testimonial,
  p.notes,
  p.created_at,
  p.updated_at,
  COALESCE(
    (
      SELECT jsonb_agg(review_payload ORDER BY highlight DESC, display_order NULLS LAST, created_at DESC)
      FROM (
        SELECT
          (to_jsonb(dr.*) || jsonb_build_object(
            'doctor_name', d.name,
            'doctor_title', d.title,
            'doctor_avatar_url', d.avatar_url,
            'treatment_name', t.name,
            'treatment_slug', t.slug
          )) AS review_payload,
          COALESCE(dr.highlight, false) AS highlight,
          dr.display_order,
          dr.created_at
        FROM public.doctor_reviews dr
        LEFT JOIN public.doctors d ON d.id = dr.doctor_id
        LEFT JOIN public.treatments t ON t.id = dr.treatment_id
        WHERE dr.patient_id = p.id
      ) reviews
    ),
    '[]'::jsonb
  ) AS reviews,
  COALESCE(
    (
      SELECT jsonb_agg(story_payload ORDER BY featured DESC, display_order NULLS LAST, created_at DESC)
      FROM (
        SELECT
          (to_jsonb(ps.*) || jsonb_build_object(
            'patient_name', p.full_name,
            'doctor_name', d.name,
            'doctor_title', d.title,
            'doctor_avatar_url', d.avatar_url,
            'treatment_name', t.name,
            'treatment_slug', t.slug
          )) AS story_payload,
          COALESCE(ps.featured, false) AS featured,
          ps.display_order,
          ps.created_at
        FROM public.patient_stories ps
        LEFT JOIN public.doctors d ON d.id = ps.doctor_id
        LEFT JOIN public.treatments t ON t.id = ps.treatment_id
        WHERE ps.patient_id = p.id
      ) stories
    ),
    '[]'::jsonb
  ) AS stories,
  (
    SELECT COUNT(*)::integer
    FROM public.doctor_reviews dr
    WHERE dr.patient_id = p.id
  ) AS total_review_count,
  (
    SELECT COUNT(*)::integer
    FROM public.doctor_reviews dr
    WHERE dr.patient_id = p.id AND dr.published IS TRUE
  ) AS published_review_count,
  (
    SELECT COUNT(*)::integer
    FROM public.patient_stories ps
    WHERE ps.patient_id = p.id
  ) AS total_story_count,
  (
    SELECT COUNT(*)::integer
    FROM public.patient_stories ps
    WHERE ps.patient_id = p.id AND ps.published IS TRUE
  ) AS published_story_count
FROM public.patients p;

COMMENT ON VIEW public.patient_testimonial_rollup IS
  'Aggregates patient records with all linked doctor reviews and stories for admin tools.';

CREATE OR REPLACE VIEW public.patient_testimonial_public AS
SELECT
  r.patient_id,
  r.full_name,
  r.nationality,
  r.home_city,
  r.travel_year,
  r.has_testimonial,
  r.created_at,
  r.updated_at,
  (
    SELECT COALESCE(
      jsonb_agg(review_element)
        FILTER (WHERE review_element->>'published' = 'true' AND review_element->>'is_verified' <> 'false'),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(r.reviews) AS review_element
  ) AS reviews,
  (
    SELECT COALESCE(
      jsonb_agg(story_element)
        FILTER (WHERE story_element->>'published' = 'true'),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(r.stories) AS story_element
  ) AS stories,
  r.published_review_count,
  r.published_story_count
FROM public.patient_testimonial_rollup r
WHERE
  r.published_review_count > 0
  OR r.published_story_count > 0
  OR r.has_testimonial IS TRUE;

COMMENT ON VIEW public.patient_testimonial_public IS
  'Published testimonials per patient for marketing experiences.';

COMMIT;
