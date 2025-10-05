-- Normalize legacy testimonial JSON fields that were stored as strings.
DO $$
BEGIN
  -- Patient stories: coerce stringified JSON back into proper jsonb arrays.
  UPDATE public.patient_stories
  SET
    media = CASE
      WHEN jsonb_typeof(media) = 'string' THEN
        CASE
          WHEN trim('"' FROM media::text) = '' THEN '[]'::jsonb
          ELSE trim('"' FROM media::text)::jsonb
        END
      ELSE media
    END,
    outcome_summary = CASE
      WHEN jsonb_typeof(outcome_summary) = 'string' THEN
        CASE
          WHEN trim('"' FROM outcome_summary::text) = '' THEN '[]'::jsonb
          ELSE trim('"' FROM outcome_summary::text)::jsonb
        END
      ELSE outcome_summary
    END
  WHERE
    jsonb_typeof(media) = 'string'
    OR jsonb_typeof(outcome_summary) = 'string';

  -- Doctor reviews: same cleanup for media attachments.
  UPDATE public.doctor_reviews
  SET media = CASE
    WHEN jsonb_typeof(media) = 'string' THEN
      CASE
        WHEN trim('"' FROM media::text) = '' THEN '[]'::jsonb
        ELSE trim('"' FROM media::text)::jsonb
      END
    ELSE media
  END
  WHERE jsonb_typeof(media) = 'string';
END
$$;
