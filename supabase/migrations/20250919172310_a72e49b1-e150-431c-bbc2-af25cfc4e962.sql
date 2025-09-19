-- Add a policy to allow authenticated users to view profiles in community contexts
-- This ensures users can see profile data when viewing community posts

CREATE POLICY "Community members can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  (auth.uid() = user_id) 
  OR 
  -- Users can see profiles of community members
  (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM community_memberships cm1, community_memberships cm2
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = profiles.user_id
      AND cm1.community_id = cm2.community_id
    )
  )
  OR
  -- Users can see public profiles
  (
    user_id <> auth.uid() 
    AND (
      EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_settings.user_id = profiles.user_id 
        AND user_settings.profile_visibility = 'public'
      )
      OR NOT EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_settings.user_id = profiles.user_id
      )
    )
  )
);