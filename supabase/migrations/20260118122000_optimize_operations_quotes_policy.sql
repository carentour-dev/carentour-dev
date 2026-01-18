-- Optimize operations_quotes policy auth lookup
BEGIN;

ALTER POLICY operations_quotes_owner_policy
ON public.operations_quotes
USING (owner_user_id = (SELECT auth.uid()))
WITH CHECK (owner_user_id = (SELECT auth.uid()));

COMMIT;
