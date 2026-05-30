-- Keep patient-facing delivery fields aligned with consultation type.
--
-- Video and phone consultations must not expose internal placeholder locations
-- such as "Smoke test virtual consultation". Application code requires onsite
-- locations; the database guardrail prevents incompatible delivery fields from
-- leaking between consultation types.

UPDATE public.consultation_slots
SET
    location = CASE
        WHEN booking_type IN ('video', 'phone') THEN NULL
        ELSE NULLIF(BTRIM(location), '')
    END,
    meeting_url = CASE
        WHEN booking_type = 'video' THEN NULLIF(BTRIM(meeting_url), '')
    END
WHERE
    (booking_type IN ('video', 'phone') AND location IS NOT NULL)
    OR (booking_type IN ('onsite', 'phone') AND meeting_url IS NOT NULL)
    OR location IS DISTINCT FROM NULLIF(BTRIM(location), '')
    OR meeting_url IS DISTINCT FROM NULLIF(BTRIM(meeting_url), '');

UPDATE public.appointment_bookings
SET
    location = CASE
        WHEN booking_type IN ('video', 'phone') THEN NULL
        ELSE NULLIF(BTRIM(location), '')
    END,
    meeting_url = CASE
        WHEN booking_type = 'video' THEN NULLIF(BTRIM(meeting_url), '')
    END
WHERE
    (booking_type IN ('video', 'phone') AND location IS NOT NULL)
    OR (booking_type IN ('onsite', 'phone') AND meeting_url IS NOT NULL)
    OR location IS DISTINCT FROM NULLIF(BTRIM(location), '')
    OR meeting_url IS DISTINCT FROM NULLIF(BTRIM(meeting_url), '');

UPDATE public.patient_consultations
SET
    location = CASE
        WHEN booking_type IN ('video', 'phone') THEN NULL
        ELSE NULLIF(BTRIM(location), '')
    END,
    meeting_url = CASE
        WHEN booking_type = 'video' THEN NULLIF(BTRIM(meeting_url), '')
    END
WHERE
    (booking_type IN ('video', 'phone') AND location IS NOT NULL)
    OR (booking_type IN ('onsite', 'phone') AND meeting_url IS NOT NULL)
    OR location IS DISTINCT FROM NULLIF(BTRIM(location), '')
    OR meeting_url IS DISTINCT FROM NULLIF(BTRIM(meeting_url), '');

ALTER TABLE public.consultation_slots
DROP CONSTRAINT IF EXISTS consultation_slots_delivery_fields_match_type;

ALTER TABLE public.consultation_slots
ADD CONSTRAINT consultation_slots_delivery_fields_match_type
CHECK (
    (
        booking_type = 'onsite'
        AND meeting_url IS NULL
    )
    OR (
        booking_type = 'video'
        AND location IS NULL
    )
    OR (
        booking_type = 'phone'
        AND location IS NULL
        AND meeting_url IS NULL
    )
) NOT VALID;

ALTER TABLE public.appointment_bookings
DROP CONSTRAINT IF EXISTS appointment_bookings_delivery_fields_match_type;

ALTER TABLE public.appointment_bookings
ADD CONSTRAINT appointment_bookings_delivery_fields_match_type
CHECK (
    (
        booking_type = 'onsite'
        AND meeting_url IS NULL
    )
    OR (
        booking_type = 'video'
        AND location IS NULL
    )
    OR (
        booking_type = 'phone'
        AND location IS NULL
        AND meeting_url IS NULL
    )
) NOT VALID;

ALTER TABLE public.patient_consultations
DROP CONSTRAINT IF EXISTS patient_consultations_delivery_fields_match_type;

ALTER TABLE public.patient_consultations
ADD CONSTRAINT patient_consultations_delivery_fields_match_type
CHECK (
    (
        booking_type = 'onsite'
        AND meeting_url IS NULL
    )
    OR (
        booking_type = 'video'
        AND location IS NULL
    )
    OR (
        booking_type = 'phone'
        AND location IS NULL
        AND meeting_url IS NULL
    )
) NOT VALID;
