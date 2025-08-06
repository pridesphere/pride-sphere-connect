-- Update community_memberships role column to support owner/admin roles
ALTER TABLE community_memberships DROP CONSTRAINT IF EXISTS community_memberships_role_check;
ALTER TABLE community_memberships ADD CONSTRAINT community_memberships_role_check 
CHECK (role IN ('owner', 'admin', 'member'));