BEGIN;

ALTER TABLE public.blog_post_translations
DROP COLUMN IF EXISTS pre_body_blocks,
DROP COLUMN IF EXISTS post_body_blocks;

COMMIT;
