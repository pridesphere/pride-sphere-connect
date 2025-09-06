-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Owners can update communities" ON communities;
DROP POLICY IF EXISTS "Owners can delete communities" ON communities;

-- Add role column to community_memberships if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_memberships' AND column_name='role') THEN
        ALTER TABLE community_memberships ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'));
    END IF;
END $$;

-- Add created_by column to communities if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='created_by') THEN
        ALTER TABLE communities ADD COLUMN created_by UUID REFERENCES profiles(user_id);
    END IF;
END $$;

-- Add deleted_at column for soft deletes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='deleted_at') THEN
        ALTER TABLE communities ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END $$;

-- Update existing communities to have proper created_by values from first membership
UPDATE communities 
SET created_by = (
    SELECT user_id FROM community_memberships 
    WHERE community_id = communities.id 
    ORDER BY joined_at ASC 
    LIMIT 1
) 
WHERE created_by IS NULL;

-- Set first member as owner for existing communities
UPDATE community_memberships 
SET role = 'owner' 
WHERE id IN (
    SELECT DISTINCT ON (community_id) id 
    FROM community_memberships 
    ORDER BY community_id, joined_at ASC
) AND role = 'member';

-- Now recreate the policies
CREATE POLICY "Owners can update communities" 
ON communities 
FOR UPDATE 
USING (auth.uid() = created_by AND deleted_at IS NULL);

CREATE POLICY "Owners can delete communities" 
ON communities 
FOR DELETE 
USING (auth.uid() = created_by);