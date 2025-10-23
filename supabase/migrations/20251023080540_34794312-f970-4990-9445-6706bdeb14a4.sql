-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "authenticated_users_insert_conversations" ON conversations;

-- Create a new INSERT policy that allows authenticated users to create conversations
CREATE POLICY "Users can create conversations" 
ON conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (created_by = auth.uid() OR created_by IS NULL)
);

-- Also ensure the created_by column has a default value
ALTER TABLE conversations 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);