-- Update the conversation_participants RLS policy to allow conversation creators to add participants
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_participants;

-- New policy: Allow conversation creators to add any participants and users to add themselves
CREATE POLICY "Conversation creators and users can add participants" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = conversation_participants.conversation_id 
    AND conversations.created_by = auth.uid()
  )
);