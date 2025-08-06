-- Fix the function security issue by setting search_path
CREATE OR REPLACE FUNCTION public.delete_community_cascade(community_id_param UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete all posts in this community
  DELETE FROM posts WHERE community_id = community_id_param;
  
  -- Delete all memberships
  DELETE FROM community_memberships WHERE community_id = community_id_param;
  
  -- Finally delete the community
  DELETE FROM communities WHERE id = community_id_param;
END;
$$;