-- Extend profile data with additional demographic and contact fields
BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS sex TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Refresh handle_new_user trigger to sync new profile fields
-- from Supabase auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
  default_role_id UUID;
  meta_date_of_birth TEXT;
  meta_sex TEXT;
  meta_nationality TEXT;
  meta_phone TEXT;
BEGIN
  meta_date_of_birth := NEW.raw_user_meta_data ->> 'date_of_birth';
  meta_sex := NEW.raw_user_meta_data ->> 'sex';
  meta_nationality := NEW.raw_user_meta_data ->> 'nationality';
  meta_phone := NEW.raw_user_meta_data ->> 'phone';

  INSERT INTO public.profiles (
    user_id,
    email,
    username,
    date_of_birth,
    sex,
    nationality,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(meta_date_of_birth, '')::DATE,
    NULLIF(meta_sex, ''),
    NULLIF(meta_nationality, ''),
    NULLIF(meta_phone, '')
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      email = EXCLUDED.email,
      username = COALESCE(
        EXCLUDED.username,
        public.profiles.username
      ),
      date_of_birth = COALESCE(
        EXCLUDED.date_of_birth,
        public.profiles.date_of_birth
      ),
      sex = COALESCE(EXCLUDED.sex, public.profiles.sex),
      nationality = COALESCE(
        EXCLUDED.nationality,
        public.profiles.nationality
      ),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone)
  RETURNING id INTO new_profile_id;

  IF new_profile_id IS NULL THEN
    SELECT id INTO new_profile_id
    FROM public.profiles
    WHERE user_id = NEW.id;
  END IF;

  SELECT id INTO default_role_id
  FROM public.roles
  WHERE slug = 'user'
  LIMIT 1;

  IF default_role_id IS NOT NULL AND new_profile_id IS NOT NULL THEN
    INSERT INTO public.profile_roles (profile_id, role_id)
    VALUES (new_profile_id, default_role_id)
    ON CONFLICT (profile_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
