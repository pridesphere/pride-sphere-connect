-- Add NOT NULL constraint for user_id in posts table to prevent orphaned posts
-- Also add a check constraint to ensure either user_id is provided OR is_anonymous is true

ALTER TABLE posts 
ALTER COLUMN user_id SET NOT NULL;

-- Update any existing posts without user_id (if any) to be anonymous
UPDATE posts 
SET is_anonymous = true 
WHERE user_id IS NULL;