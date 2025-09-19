-- Fix the communities UPDATE policy to allow ownership transfers
-- The current policy prevents updating created_by during ownership transfer

-- Drop the existing update policy
DROP POLICY IF EXISTS "Owners can update communities" ON public.communities;

-- Create a new update policy that allows ownership transfers
-- This policy allows updates when:
-- 1. The current user is the original owner (for regular updates)
-- 2. OR the current user is the original owner and is transferring ownership (changing created_by)
CREATE POLICY "Owners can update and transfer communities" 
ON public.communities 
FOR UPDATE 
USING (
  (auth.uid() = created_by AND deleted_at IS NULL) OR
  -- Allow ownership transfer: current user is original owner
  (auth.uid() = created_by AND deleted_at IS NULL)
) 
WITH CHECK (
  -- For regular updates: user must be the owner
  (auth.uid() = created_by AND deleted_at IS NULL) OR
  -- For ownership transfer: original user is transferring to someone else
  (deleted_at IS NULL)
);