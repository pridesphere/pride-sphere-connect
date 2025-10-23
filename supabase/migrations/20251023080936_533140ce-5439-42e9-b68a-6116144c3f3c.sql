-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a simple, working INSERT policy for authenticated users
CREATE POLICY "Enable insert for authenticated users" 
ON conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Update the SELECT policy to work with conversation participants
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;

CREATE POLICY "Participants can view conversations" 
ON conversations 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Update the UPDATE policy
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;

CREATE POLICY "Participants can update conversations" 
ON conversations 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);