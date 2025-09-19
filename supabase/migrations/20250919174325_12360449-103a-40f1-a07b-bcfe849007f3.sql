-- Fix the communities UPDATE policy to properly handle ownership transfers
-- The issue is that when transferring ownership, the created_by field changes
-- but the policy needs to allow this specific case

-- Drop the current policy
DROP POLICY IF EXISTS "Owners can update and transfer communities" ON public.communities;

-- Create a more specific policy that handles ownership transfers correctly
CREATE POLICY "Owners can update communities and transfer ownership" 
ON public.communities 
FOR UPDATE 
USING (
  -- User must be the current owner and community must not be deleted
  auth.uid() = created_by AND deleted_at IS NULL
) 
WITH CHECK (
  -- Allow regular updates (owner stays the same) OR 
  -- Allow ownership transfer (created_by can change to any valid user)
  (deleted_at IS NULL) AND (
    -- Either keeping the same owner (regular update)
    auth.uid() = created_by OR 
    -- Or transferring to someone else (created_by changes)
    created_by IS NOT NULL
  )
);