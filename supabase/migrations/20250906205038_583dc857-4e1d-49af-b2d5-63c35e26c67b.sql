-- Add role column to community_memberships if it doesn't exist
ALTER TABLE community_memberships 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
CHECK (role IN ('owner', 'admin', 'member'));

-- Add created_by column to communities if it doesn't exist
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Add deleted_at column for soft deletes
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create function to handle community creation with owner membership
CREATE OR REPLACE FUNCTION create_community_with_owner(
  community_name TEXT,
  community_description TEXT DEFAULT NULL,
  community_category TEXT DEFAULT 'General',
  community_tags TEXT[] DEFAULT NULL,
  community_avatar_url TEXT DEFAULT NULL,
  community_banner_url TEXT DEFAULT NULL,
  is_premium BOOLEAN DEFAULT FALSE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_community_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Insert community
  INSERT INTO communities (
    name, 
    description, 
    category, 
    tags, 
    avatar_url, 
    banner_url, 
    is_premium, 
    created_by,
    member_count
  ) VALUES (
    community_name, 
    community_description, 
    community_category, 
    community_tags, 
    community_avatar_url, 
    community_banner_url, 
    is_premium, 
    current_user_id,
    1
  ) RETURNING id INTO new_community_id;

  -- Add creator as owner
  INSERT INTO community_memberships (
    community_id,
    user_id,
    role
  ) VALUES (
    new_community_id,
    current_user_id,
    'owner'
  );

  RETURN new_community_id;
END;
$$;

-- Create function to transfer ownership
CREATE OR REPLACE FUNCTION transfer_community_ownership(
  community_id_param UUID,
  new_owner_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships 
    WHERE community_id = community_id_param 
    AND user_id = current_user_id 
    AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the community owner can transfer ownership';
  END IF;

  -- Check if new owner is a member
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships 
    WHERE community_id = community_id_param 
    AND user_id = new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a community member';
  END IF;

  -- Update current owner to admin
  UPDATE community_memberships 
  SET role = 'admin' 
  WHERE community_id = community_id_param 
  AND user_id = current_user_id;

  -- Update new owner
  UPDATE community_memberships 
  SET role = 'owner' 
  WHERE community_id = community_id_param 
  AND user_id = new_owner_id;
END;
$$;

-- Update the existing delete function to handle soft deletes and proper cascading
DROP FUNCTION IF EXISTS public.delete_community_cascade(uuid);

CREATE OR REPLACE FUNCTION delete_community_cascade(community_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships 
    WHERE community_id = community_id_param 
    AND user_id = current_user_id 
    AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the community owner can delete the community';
  END IF;

  -- Delete all posts in this community
  DELETE FROM posts WHERE community_id = community_id_param;
  
  -- Delete all memberships
  DELETE FROM community_memberships WHERE community_id = community_id_param;
  
  -- Finally delete the community
  DELETE FROM communities WHERE id = community_id_param;
END;
$$;

-- Update RLS policies for communities to exclude soft-deleted ones
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;

CREATE POLICY "Anyone can view active communities" 
ON communities 
FOR SELECT 
USING (deleted_at IS NULL);

-- Update RLS policy for community creation to set created_by
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;

CREATE POLICY "Authenticated users can create communities" 
ON communities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND deleted_at IS NULL);

-- Add policy for owners to update communities
CREATE POLICY "Owners can update communities" 
ON communities 
FOR UPDATE 
USING (auth.uid() = created_by AND deleted_at IS NULL);

-- Add policy for owners to delete communities
CREATE POLICY "Owners can delete communities" 
ON communities 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update community_memberships policies to handle roles
DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships;

CREATE POLICY "Non-owners can leave communities" 
ON community_memberships 
FOR DELETE 
USING (auth.uid() = user_id AND role != 'owner');

-- Add policy for owners to manage memberships
CREATE POLICY "Owners can manage memberships" 
ON community_memberships 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM community_memberships cm 
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'owner'
  )
);