-- Fix existing community creators who should be owners
UPDATE community_memberships 
SET role = 'owner' 
WHERE user_id IN (
  SELECT c.created_by 
  FROM communities c 
  WHERE c.created_by = community_memberships.user_id 
  AND c.id = community_memberships.community_id
) 
AND role = 'member';