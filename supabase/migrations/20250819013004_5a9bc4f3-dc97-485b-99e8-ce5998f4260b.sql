-- Fix profile visibility security vulnerability
-- Replace the overly permissive "Users can view all profiles" policy with privacy-aware policies

-- First, drop the existing overly permissive policy
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create new privacy-aware policies for profile visibility
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can view public profiles
CREATE POLICY "Authenticated users can view public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  user_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_id = profiles.user_id 
    AND privacy_level = 'public'
  )
);

-- Policy 3: Handle profiles without settings (default to public for existing users)
CREATE POLICY "View profiles without settings as public" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  user_id != auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_id = profiles.user_id
  )
);