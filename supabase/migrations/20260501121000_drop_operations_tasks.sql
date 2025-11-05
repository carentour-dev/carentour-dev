-- Roll back Operations personal tasks feature
BEGIN;

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name = 'operations_tasks'
    )
    INTO table_exists;

    IF table_exists THEN
        EXECUTE 'DROP TRIGGER IF EXISTS operations_tasks_set_updated_at ON public.operations_tasks';
        EXECUTE 'DROP POLICY IF EXISTS operations_tasks_owner_policy ON public.operations_tasks';
        EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public.operations_tasks FROM authenticated';
        EXECUTE 'DROP TABLE public.operations_tasks';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type typ
        JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
        WHERE nsp.nspname = 'public'
            AND typ.typname = 'operations_task_status'
    ) THEN
        DROP TYPE PUBLIC.OPERATIONS_TASK_STATUS;
    END IF;
END;
$$;

COMMIT;
