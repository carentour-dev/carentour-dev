BEGIN;

-- Provide a controlled interface for testimonial data while keeping views locked down.
CREATE OR REPLACE FUNCTION public.get_patient_testimonial(p_patient_id UUID)
RETURNS public.patient_testimonial_public
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.patient_testimonial_public%ROWTYPE;
BEGIN
  SELECT *
    INTO result
  FROM public.patient_testimonial_public
  WHERE patient_id = p_patient_id;

  RETURN result;
END;
$$;

-- Prevent direct selection from testimonial views by untrusted roles.
REVOKE SELECT ON public.patient_testimonial_public FROM anon, authenticated;
REVOKE SELECT ON public.patient_testimonial_rollup FROM anon, authenticated;

-- Allow application roles to use the secure function instead.
GRANT EXECUTE ON FUNCTION public.get_patient_testimonial(UUID) TO anon, authenticated;

COMMIT;
