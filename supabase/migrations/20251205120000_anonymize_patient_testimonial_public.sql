BEGIN;

-- Ensure public testimonial data never exposes real patient names.
CREATE OR REPLACE VIEW public.patient_testimonial_public AS
SELECT
  r.patient_id,
  public.generate_anonymized_patient_name(r.patient_id) AS full_name,
  r.nationality,
  r.home_city,
  r.travel_year,
  r.has_testimonial,
  r.created_at,
  r.updated_at,
  (
    SELECT COALESCE(
      jsonb_agg(
        (review_element - 'patient_name') || jsonb_build_object(
          'patient_name', public.generate_anonymized_patient_name(r.patient_id)
        )
      )
        FILTER (WHERE review_element->>'published' = 'true' AND review_element->>'is_verified' <> 'false'),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(r.reviews) AS review_element
  ) AS reviews,
  (
    SELECT COALESCE(
      jsonb_agg(
        (story_element - 'patient_name') || jsonb_build_object(
          'patient_name', public.generate_anonymized_patient_name(r.patient_id)
        )
      )
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
  'Published testimonials per patient for marketing experiences with anonymized patient names.';

COMMIT;
