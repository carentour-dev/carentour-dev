-- Remove the overly permissive policy that allows everyone to view all profiles
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Allow users to view basic public info (username, avatar) of other users
-- but NOT email addresses. Uncomment if your app needs this functionality:
-- CREATE POLICY "Users can view public profile info of others" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (true)
-- WITH CHECK (auth.uid() IS NOT NULL);