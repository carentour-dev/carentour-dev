-- Seed admin user for local development only
DO $$
DECLARE
  admin_user RECORD;
  project_id TEXT;
BEGIN
  project_id := current_setting('app.settings.project_id', true);

  -- Skip seeding unless explicitly marked as local development.
  IF project_id IS DISTINCT FROM 'local' THEN
    RAISE NOTICE 'Skipping admin seed for project_id=%', project_id;
    RETURN;
  END IF;

  SELECT *
  INTO admin_user
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE u.email = 'admin+seed@local.dev';

  IF admin_user IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin+seed@local.dev', crypt('Admin123!', gen_salt('bf')));

    INSERT INTO public.profiles (user_id, email, username, role)
    VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'admin+seed@local.dev',
      'Admin',
      'admin'
    );
  ELSE
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = admin_user.id;
  END IF;
END $$;
