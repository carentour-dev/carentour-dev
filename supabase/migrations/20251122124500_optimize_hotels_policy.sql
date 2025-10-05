-- Optimize hotels policy to avoid repeated auth context lookups
ALTER POLICY "Service role manages hotels"
ON public.hotels
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');
