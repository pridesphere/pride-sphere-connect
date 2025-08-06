-- Add soft delete capability to communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communities_deleted_at ON communities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);

-- Create function to handle community deletion cascade
CREATE OR REPLACE FUNCTION public.delete_community_cascade(community_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all posts in this community
  DELETE FROM posts WHERE community_id = community_id_param;
  
  -- Delete all memberships
  DELETE FROM community_memberships WHERE community_id = community_id_param;
  
  -- Finally delete the community
  DELETE FROM communities WHERE id = community_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;