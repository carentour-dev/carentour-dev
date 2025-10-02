-- Seed admin user for local development
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  SELECT *
  INTO admin_user
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE u.email = 'admin@local.dev';

  IF admin_user IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@local.dev', crypt('Admin123!', gen_salt('bf')));

    INSERT INTO public.profiles (user_id, email, username, role)
    VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'admin@local.dev',
      'Admin',
      'admin'
    );
  ELSE
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = admin_user.id;
  END IF;
END $$;
