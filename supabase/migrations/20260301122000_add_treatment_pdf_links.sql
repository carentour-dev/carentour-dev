-- Add optional patient-facing download link for treatments
alter table public.treatments
add column if not exists download_url text;

-- Surface optional procedure collateral and notes fields
alter table public.treatment_procedures
add column if not exists pdf_url text,
add column if not exists additional_notes text;
