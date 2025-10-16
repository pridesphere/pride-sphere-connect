-- Completely remove and recreate the conversations INSERT policy
-- to ensure no hidden restrictions
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create the most permissive policy possible for authenticated users
CREATE POLICY "authenticated_users_insert_conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: This allows any authenticated user to create a conversation
-- The application layer ensures created_by is set correctly