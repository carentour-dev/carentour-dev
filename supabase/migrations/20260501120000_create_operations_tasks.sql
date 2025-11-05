-- Create personal task tracking for Operations team members
BEGIN;

-- Task status lifecycle covers the three primary Kanban buckets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type typ
        JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
        WHERE nsp.nspname = 'public'
            AND typ.typname = 'operations_task_status'
    ) THEN
        CREATE TYPE public.operations_task_status AS ENUM (
            'pending',
            'in_progress',
            'done'
        );
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.operations_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    owner_profile_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    description TEXT,
    status PUBLIC.OPERATIONS_TASK_STATUS NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS operations_tasks_owner_status_idx
ON public.operations_tasks (
    owner_user_id,
    status
);

CREATE INDEX IF NOT EXISTS operations_tasks_owner_created_idx
ON public.operations_tasks (
    owner_user_id,
    created_at DESC
);

ALTER TABLE public.operations_tasks
ENABLE ROW LEVEL SECURITY;

-- Authenticated staff can read and manage only the tasks they own.
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_tasks
TO authenticated;

DROP POLICY IF EXISTS operations_tasks_owner_policy
ON public.operations_tasks;
CREATE POLICY operations_tasks_owner_policy
ON public.operations_tasks
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP TRIGGER IF EXISTS operations_tasks_set_updated_at
ON public.operations_tasks;
CREATE TRIGGER operations_tasks_set_updated_at
BEFORE UPDATE ON public.operations_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
