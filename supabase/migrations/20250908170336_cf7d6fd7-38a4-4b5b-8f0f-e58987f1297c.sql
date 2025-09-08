-- Fix security issue: Restrict profile visibility based on privacy settings

-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new secure policies for profile access
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Authenticated users can view profiles that are set to public visibility
CREATE POLICY "Authenticated users can view public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  user_id != auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_settings.user_id = profiles.user_id 
    AND user_settings.profile_visibility = 'public'
  )
);

-- 3. For users without explicit settings, default to public (backward compatibility)
CREATE POLICY "Default public visibility for profiles without settings" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  user_id != auth.uid() AND 
  NOT EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_settings.user_id = profiles.user_id
  )
);