-- Refine hotels policies to avoid redundant evaluations and satisfy Supabase warnings
ALTER POLICY "Hotels are public"
ON public.hotels
TO anon, authenticated;

ALTER POLICY "Service role manages hotels"
ON public.hotels
TO service_role;
