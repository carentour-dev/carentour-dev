-- Create dedicated table for Start Journey form submissions
-- Separates intake flow data from generic contact requests

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'journey_submission_status'
    ) THEN
        CREATE TYPE public.journey_submission_status AS ENUM (
            'new',
            'reviewing',
            'contacted',
            'consultation_scheduled',
            'completed',
            'archived'
        );
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.start_journey_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    age TEXT,
    country TEXT NOT NULL,

    -- Treatment details
    treatment_id UUID
    REFERENCES public.treatments (id) ON DELETE SET NULL,
    treatment_name TEXT,
    procedure_id UUID
    REFERENCES public.treatment_procedures (id) ON DELETE SET NULL,
    procedure_name TEXT,
    timeline TEXT,
    budget_range TEXT,

    -- Medical information
    medical_condition TEXT NOT NULL,
    previous_treatments TEXT,
    current_medications TEXT,
    allergies TEXT,
    doctor_preference TEXT,
    accessibility_needs TEXT,

    -- Travel preferences
    travel_dates JSONB,
    accommodation_type TEXT,
    companion_travelers TEXT,
    dietary_requirements TEXT,
    language_preference TEXT,
    language_notes TEXT,

    -- Document flags
    has_insurance BOOLEAN DEFAULT FALSE,
    has_passport BOOLEAN DEFAULT FALSE,
    has_medical_records BOOLEAN DEFAULT FALSE,

    -- Documents metadata
    documents JSONB,

    -- Consultation preference
    consultation_mode TEXT,

    -- System fields
    status public.JOURNEY_SUBMISSION_STATUS NOT NULL DEFAULT 'new',
    user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    patient_id UUID
    REFERENCES public.patients (id) ON DELETE SET NULL,
    assigned_to UUID
    REFERENCES public.profiles (id) ON DELETE SET NULL,
    consultation_id UUID
    REFERENCES public.patient_consultations (id) ON DELETE SET NULL,
    origin TEXT NOT NULL DEFAULT 'web',
    notes TEXT,
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.start_journey_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'start_journey_submissions'
            AND policyname = 'Anyone can submit a journey intake'
    ) THEN
        CREATE POLICY "Anyone can submit a journey intake"
            ON public.start_journey_submissions
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (
                (user_id IS NULL AND patient_id IS NULL)
                OR (
                    (SELECT auth.uid()) IS NOT NULL
                    AND user_id = (SELECT auth.uid())
                    AND (
                        patient_id IS NULL
                        OR patient_id IN (
                            SELECT id
                            FROM public.patients
                            WHERE user_id = (SELECT auth.uid())
                        )
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'start_journey_submissions'
            AND policyname = 'Patients can view their submissions'
    ) THEN
        CREATE POLICY "Patients can view their submissions"
            ON public.start_journey_submissions
            FOR SELECT
            TO authenticated
            USING (
                user_id = (SELECT auth.uid())
                OR (
                    patient_id IS NOT NULL
                    AND patient_id IN (
                        SELECT id
                        FROM public.patients
                        WHERE user_id = (SELECT auth.uid())
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'start_journey_submissions'
            AND policyname = 'Service role manages submissions'
    ) THEN
        CREATE POLICY "Service role manages submissions"
            ON public.start_journey_submissions
            FOR ALL
            TO service_role
            USING (TRUE)
            WITH CHECK (TRUE);
    END IF;
END;
$$;

-- Triggers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_start_journey_submissions_updated_at'
            AND tgrelid = 'public.start_journey_submissions'::REGCLASS
    ) THEN
        CREATE TRIGGER update_start_journey_submissions_updated_at
            BEFORE UPDATE ON public.start_journey_submissions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_status
ON public.start_journey_submissions (status);

CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_created_at
ON public.start_journey_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_user_id
ON public.start_journey_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_patient_id
ON public.start_journey_submissions (patient_id);

CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_assigned_to
ON public.start_journey_submissions (assigned_to);

CREATE INDEX IF NOT EXISTS idx_start_journey_submissions_treatment_id
ON public.start_journey_submissions (treatment_id);
