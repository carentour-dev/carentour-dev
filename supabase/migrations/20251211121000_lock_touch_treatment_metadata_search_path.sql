-- Ensure touch_treatment_metadata trigger runs with a predictable search_path
CREATE OR REPLACE FUNCTION public.touch_treatment_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$function$;
