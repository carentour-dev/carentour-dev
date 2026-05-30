BEGIN;

ALTER TABLE public.appointment_bookings
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archive_note text;

CREATE INDEX IF NOT EXISTS idx_appointment_bookings_archived_at
ON public.appointment_bookings (archived_at);

COMMIT;
