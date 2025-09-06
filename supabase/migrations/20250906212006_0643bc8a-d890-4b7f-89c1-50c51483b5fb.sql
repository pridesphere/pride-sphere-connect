-- Create blocked_members table to track blocked users
CREATE TABLE public.blocked_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  blocked_by UUID NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  UNIQUE(community_id, user_id)
);

-- Enable RLS on blocked_members
ALTER TABLE public.blocked_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_members
CREATE POLICY "Community owners can view blocked members" 
ON public.blocked_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = blocked_members.community_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Community owners can block members" 
ON public.blocked_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = blocked_by AND
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = blocked_members.community_id 
    AND created_by = auth.uid()
  )
);

-- Function to block a member and remove them from community
CREATE OR REPLACE FUNCTION public.block_community_member(
  community_id_param UUID,
  user_id_param UUID,
  reason_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is the community owner
  IF NOT EXISTS (
    SELECT 1 FROM communities 
    WHERE id = community_id_param 
    AND created_by = current_user_id
  ) THEN
    RAISE EXCEPTION 'Only community owners can block members';
  END IF;

  -- Cannot block yourself
  IF current_user_id = user_id_param THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Add to blocked_members table
  INSERT INTO blocked_members (community_id, user_id, blocked_by, reason)
  VALUES (community_id_param, user_id_param, current_user_id, reason_param)
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- Remove from community_memberships
  DELETE FROM community_memberships 
  WHERE community_id = community_id_param 
  AND user_id = user_id_param;

  -- Update member count
  UPDATE communities 
  SET member_count = member_count - 1 
  WHERE id = community_id_param;
END;
$$;

-- Function to delete all posts from a user in a community
CREATE OR REPLACE FUNCTION public.delete_user_posts_in_community(
  community_id_param UUID,
  user_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is the community owner
  IF NOT EXISTS (
    SELECT 1 FROM communities 
    WHERE id = community_id_param 
    AND created_by = current_user_id
  ) THEN
    RAISE EXCEPTION 'Only community owners can delete member posts';
  END IF;

  -- Delete all posts from the user in this community
  DELETE FROM posts 
  WHERE community_id = community_id_param 
  AND user_id = user_id_param;
END;
$$;

-- Update community join policy to prevent blocked users from rejoining
DROP POLICY IF EXISTS "Users can join communities" ON community_memberships;
CREATE POLICY "Users can join communities" 
ON community_memberships 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM blocked_members 
    WHERE community_id = community_memberships.community_id 
    AND user_id = auth.uid()
  )
);

-- Add policy for owners to delete any post in their community
CREATE POLICY "Community owners can delete any post" 
ON posts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = posts.community_id 
    AND created_by = auth.uid()
  )
);