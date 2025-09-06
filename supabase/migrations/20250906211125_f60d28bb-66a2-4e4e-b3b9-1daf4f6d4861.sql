-- Clean up orphaned communities (those without created_by)

-- First, delete all posts from orphaned communities
DELETE FROM posts 
WHERE community_id IN (
  SELECT id FROM communities WHERE created_by IS NULL
);

-- Delete all memberships from orphaned communities
DELETE FROM community_memberships 
WHERE community_id IN (
  SELECT id FROM communities WHERE created_by IS NULL
);

-- Delete the orphaned communities themselves
DELETE FROM communities WHERE created_by IS NULL;

-- Make created_by field required to prevent future orphaned communities
ALTER TABLE communities ALTER COLUMN created_by SET NOT NULL;