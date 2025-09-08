-- Fix infinite recursion in community_memberships RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view their community memberships" ON public.community_memberships;

-- Create a security definer function to check if user is community member
CREATE OR REPLACE FUNCTION public.is_community_member(community_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_memberships 
    WHERE community_id = community_id_param 
    AND user_id = user_id_param
  );
$$;

-- Create new policy without recursion
CREATE POLICY "Members can view their community memberships" 
ON public.community_memberships 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  public.is_community_member(community_id, auth.uid())
);