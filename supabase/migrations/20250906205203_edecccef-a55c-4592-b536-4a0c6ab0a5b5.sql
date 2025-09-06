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

  -- Update community created_by
  UPDATE communities 
  SET created_by = new_owner_id 
  WHERE id = community_id_param;
END;
$$;