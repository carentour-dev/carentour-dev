-- Auto-aggregate doctor ratings and update patient testimonial flags

-- Function to update doctor ratings from reviews
CREATE OR REPLACE FUNCTION public.update_doctor_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the doctor's rating and review count
  UPDATE public.doctors
  SET
    patient_rating = COALESCE(
      (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.doctor_reviews
        WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
          AND published = true
      ),
      0
    ),
    total_reviews = COALESCE(
      (
        SELECT COUNT(*)::integer
        FROM public.doctor_reviews
        WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
          AND published = true
      ),
      0
    )
  WHERE id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for doctor reviews insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_doctor_ratings_on_review ON public.doctor_reviews;
CREATE TRIGGER trigger_update_doctor_ratings_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_doctor_ratings();

-- Function to update patient has_testimonial flag
CREATE OR REPLACE FUNCTION public.update_patient_testimonial_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id UUID;
  v_has_testimonial BOOLEAN;
BEGIN
  -- Get the patient_id from the operation
  v_patient_id := COALESCE(NEW.patient_id, OLD.patient_id);

  IF v_patient_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Check if patient has any published testimonials
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_reviews
    WHERE patient_id = v_patient_id AND published = true
    UNION ALL
    SELECT 1
    FROM public.patient_stories
    WHERE patient_id = v_patient_id AND published = true
  ) INTO v_has_testimonial;

  -- Update patient record
  UPDATE public.patients
  SET has_testimonial = v_has_testimonial
  WHERE id = v_patient_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for doctor_reviews
DROP TRIGGER IF EXISTS trigger_update_patient_flag_on_review ON public.doctor_reviews;
CREATE TRIGGER trigger_update_patient_flag_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_testimonial_flag();

-- Trigger for patient_stories
DROP TRIGGER IF EXISTS trigger_update_patient_flag_on_story ON public.patient_stories;
CREATE TRIGGER trigger_update_patient_flag_on_story
AFTER INSERT OR UPDATE OR DELETE ON public.patient_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_testimonial_flag();

-- Backfill existing doctor ratings
UPDATE public.doctors d
SET
  patient_rating = COALESCE(
    (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.doctor_reviews
      WHERE doctor_id = d.id AND published = true
    ),
    0
  ),
  total_reviews = COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM public.doctor_reviews
      WHERE doctor_id = d.id AND published = true
    ),
    0
  );

-- Backfill existing patient testimonial flags
UPDATE public.patients p
SET has_testimonial = EXISTS (
  SELECT 1
  FROM public.doctor_reviews
  WHERE patient_id = p.id AND published = true
  UNION ALL
  SELECT 1
  FROM public.patient_stories
  WHERE patient_id = p.id AND published = true
);

COMMENT ON FUNCTION public.update_doctor_ratings() IS
  'Automatically updates doctor patient_rating and total_reviews based on published reviews';

COMMENT ON FUNCTION public.update_patient_testimonial_flag() IS
  'Automatically updates patient has_testimonial flag when reviews or stories are added/removed';
