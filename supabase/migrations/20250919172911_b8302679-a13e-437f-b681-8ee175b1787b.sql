-- Drop all existing conflicting policies on profiles table
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Default public visibility for profiles without settings" ON public.profiles;
DROP POLICY IF EXISTS "Community members can view profiles" ON public.profiles;

-- Create a single comprehensive policy that allows profile viewing
CREATE POLICY "Allow profile access for community and public viewing" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  (auth.uid() = user_id) 
  OR 
  -- Authenticated users can see any profile (for community functionality)
  (auth.uid() IS NOT NULL)
);