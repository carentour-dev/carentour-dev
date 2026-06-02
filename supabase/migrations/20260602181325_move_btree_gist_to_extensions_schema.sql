CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'btree_gist'
  ) THEN
    ALTER EXTENSION btree_gist SET SCHEMA extensions;
  END IF;
END;
$$;
