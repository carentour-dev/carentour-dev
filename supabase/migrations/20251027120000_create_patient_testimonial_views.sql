-- Aggregate reviews and stories per patient for admin and public consumption
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
          to_jsonb(dr.*) || jsonb_build_object(
            'doctor_name', d.name,
            'doctor_title', d.title,
            'doctor_avatar_url', d.avatar_url,
            'treatment_name', t.name
          ) AS review_payload,
          COALESCE(dr.highlight, false) AS highlight,
          dr.display_order,
          dr.created_at
        FROM public.doctor_reviews dr
        LEFT JOIN public.doctors d ON d.id = dr.doctor_id
        LEFT JOIN public.treatments t ON t.slug = dr.treatment_slug
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
          to_jsonb(ps.*) || jsonb_build_object(
            'patient_name', p.full_name,
            'doctor_name', d.name,
            'doctor_title', d.title,
            'doctor_avatar_url', d.avatar_url,
            'treatment_name', t.name
          ) AS story_payload,
          COALESCE(ps.featured, false) AS featured,
          ps.display_order,
          ps.created_at
        FROM public.patient_stories ps
        LEFT JOIN public.doctors d ON d.id = ps.doctor_id
        LEFT JOIN public.treatments t ON t.slug = ps.treatment_slug
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
