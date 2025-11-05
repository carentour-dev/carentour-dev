-- Optimize operations tasks RLS policy; avoid per-row auth.uid() evaluation
BEGIN;

DROP POLICY IF EXISTS operations_tasks_owner_policy
ON public.operations_tasks;

CREATE POLICY operations_tasks_owner_policy
ON public.operations_tasks
USING (owner_user_id = (SELECT auth.uid()))
WITH CHECK (owner_user_id = (SELECT auth.uid()));

COMMIT;
