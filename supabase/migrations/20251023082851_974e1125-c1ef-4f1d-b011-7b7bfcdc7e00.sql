-- CLEAN SLATE: Drop all existing conversation policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Enable select for conversation participants" ON conversations;
DROP POLICY IF EXISTS "Enable update for conversation participants" ON conversations;

DROP POLICY IF EXISTS "Participants can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Anyone can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their participants" ON conversation_participants;

-- CONVERSATIONS TABLE: Simple, working policies
CREATE POLICY "Enable insert for authenticated users" 
ON conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

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

-- CONVERSATION_PARTICIPANTS TABLE: Simple, working policies
CREATE POLICY "Participants can view conversation participants" 
ON conversation_participants 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations" 
ON conversation_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  )
);