-- Ensure a public "media" bucket exists for admin image uploads
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update
set public = true;

-- Allow authenticated users (including admins) to upload to the media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow authenticated upload to media'
  ) THEN
    CREATE POLICY "Allow authenticated upload to media"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'media' AND auth.role() = 'authenticated'
      );
  END IF;
END
$$;

-- Allow anyone to read from the public media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow public read on media'
  ) THEN
    CREATE POLICY "Allow public read on media"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'media');
  END IF;
END
$$;
