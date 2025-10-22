-- Keep patient email verification in sync with Supabase Auth confirmations
CREATE OR REPLACE FUNCTION public.sync_patient_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at AND NEW.email_confirmed_at IS NOT null THEN
    UPDATE public.patients
    SET email_verified = true
    WHERE user_id = NEW.id
      AND email_verified IS DISTINCT FROM true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_patient_email_verified ON auth.users;
CREATE TRIGGER sync_patient_email_verified
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_patient_email_verified();

-- Backfill existing patient records for already confirmed users
UPDATE public.patients AS p
SET email_verified = true
FROM auth.users AS u
WHERE
    p.user_id = u.id
    AND u.email_confirmed_at IS NOT null
    AND p.email_verified IS DISTINCT FROM true;

COMMENT ON COLUMN public.patients.email_verified IS
'true when the linked Supabase Auth user has a confirmed email.';

CREATE OR REPLACE FUNCTION public.apply_patient_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  confirmed_at TIMESTAMPTZ;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
    RETURN NEW;
  END IF;

  SELECT email_confirmed_at
    INTO confirmed_at
    FROM auth.users
   WHERE id = NEW.user_id;

  IF confirmed_at IS NOT null AND NEW.email_verified IS DISTINCT FROM true THEN
    NEW.email_verified := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_patient_email_verified ON public.patients;
CREATE TRIGGER apply_patient_email_verified
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.apply_patient_email_verified();
