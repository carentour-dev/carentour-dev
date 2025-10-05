-- Ensure pgcrypto is available for hashing helpers used by testimonial triggers.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION pgcrypto IS 'Provides digest(), gen_random_uuid(), and other cryptographic helpers.';
