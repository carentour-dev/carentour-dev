-- Allow hiding treatments from public-facing listings while keeping them
-- available in intake forms.
alter table public.treatments
add column if not exists is_listed_public boolean not null default true;
