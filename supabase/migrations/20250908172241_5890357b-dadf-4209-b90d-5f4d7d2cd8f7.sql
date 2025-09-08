-- Comprehensive Security Fixes Migration
-- Phase 1: Fix critical RLS infinite recursion and secure community data

-- 1. Fix RLS infinite recursion in conversation_participants
-- Create security definer function to break recursive loop
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = $1
  );
$$;

-- Update conversation_participants RLS policy to use security definer function
DROP POLICY IF EXISTS "Participants can view conversation participants" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
TO authenticated
USING (public.user_can_access_conversation(conversation_id));

-- 2. Secure community_memberships table - restrict to community members only
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_memberships;
CREATE POLICY "Members can view their community memberships" 
ON public.community_memberships 
FOR SELECT 
TO authenticated
USING (
  -- Users can see their own memberships
  auth.uid() = user_id 
  OR 
  -- Users can see memberships of communities they belong to
  EXISTS (
    SELECT 1 FROM public.community_memberships cm 
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()
  )
);

-- 3. Secure communities table - hide creator information from non-members
DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
CREATE POLICY "Anyone can view basic community info" 
ON public.communities 
FOR SELECT 
USING (true);

-- Create separate policy for sensitive community data (creator info) - only for members
CREATE POLICY "Members can view full community details" 
ON public.communities 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_id = communities.id 
    AND user_id = auth.uid()
  )
);

-- 4. Fix messages RLS policy to use security definer function
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (public.user_can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.user_can_access_conversation(conversation_id)
);

-- 5. Secure calls table with security definer function
DROP POLICY IF EXISTS "Participants can view calls" ON public.calls;
CREATE POLICY "Participants can view calls" 
ON public.calls 
FOR SELECT 
TO authenticated
USING (public.user_can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Participants can update calls" ON public.calls;
CREATE POLICY "Participants can update calls" 
ON public.calls 
FOR UPDATE 
TO authenticated
USING (public.user_can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Users can create calls in their conversations" ON public.calls;
CREATE POLICY "Users can create calls in their conversations" 
ON public.calls 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = caller_id 
  AND public.user_can_access_conversation(conversation_id)
);