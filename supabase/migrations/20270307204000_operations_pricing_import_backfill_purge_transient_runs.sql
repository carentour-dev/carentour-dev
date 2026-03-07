BEGIN;

DELETE FROM public.operations_pricing_import_runs
WHERE status IN ('preview', 'failed');

COMMIT;
