-- Fix conversation creation by updating RLS policies

-- Drop and recreate the conversation_participants INSERT policy to be more permissive
DROP POLICY IF EXISTS "Conversation creators and users can add participants" ON conversation_participants;

-- Create a simpler policy that allows authenticated users to add participants to conversations they have access to
CREATE POLICY "Users can add participants to conversations" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User can add themselves
    auth.uid() = user_id 
    OR 
    -- Or user is the creator of the conversation
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  )
);