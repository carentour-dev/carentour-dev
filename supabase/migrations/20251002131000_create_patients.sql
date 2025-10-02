-- Create patients table to store traveler intake details
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('female', 'male', 'non_binary', 'prefer_not_to_say')),
  nationality TEXT,
  preferred_language TEXT,
  preferred_currency TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable row level security so authenticated users only see their data
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own patient record
CREATE POLICY "Patients can view their own record"
ON public.patients
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can insert a record for themselves
CREATE POLICY "Patients can insert their own record"
ON public.patients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own record
CREATE POLICY "Patients can update their own record"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_id);

-- Reuse the shared trigger to keep updated_at in sync
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes for lookups by user and created date
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at);
