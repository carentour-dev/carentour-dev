-- Extend staff profiles with job title and language metadata
BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS language TEXT;

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
  meta_job_title TEXT;
  meta_language TEXT;
BEGIN
  meta_date_of_birth := NEW.raw_user_meta_data ->> 'date_of_birth';
  meta_sex := NEW.raw_user_meta_data ->> 'sex';
  meta_nationality := NEW.raw_user_meta_data ->> 'nationality';
  meta_phone := NEW.raw_user_meta_data ->> 'phone';
  meta_job_title :=
    COALESCE(
      NEW.raw_user_meta_data ->> 'job_title',
      NEW.raw_user_meta_data ->> 'job'
    );
  meta_language :=
    COALESCE(
      NEW.raw_user_meta_data ->> 'language',
      NEW.raw_user_meta_data ->> 'preferred_language'
    );

  INSERT INTO public.profiles (
    user_id,
    email,
    username,
    date_of_birth,
    sex,
    nationality,
    phone,
    job_title,
    language
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
    NULLIF(meta_phone, ''),
    NULLIF(meta_job_title, ''),
    NULLIF(meta_language, '')
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
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      job_title = COALESCE(EXCLUDED.job_title, public.profiles.job_title),
      language = COALESCE(EXCLUDED.language, public.profiles.language)
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
