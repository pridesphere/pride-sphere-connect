
-- First, let's check if we need to modify the conversations table structure
-- The current conversations table has different fields than what's needed

-- Update conversations table to match the required structure for direct messaging
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_message TEXT;

-- Add index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_users ON public.conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users_reverse ON public.conversations(user2_id, user1_id);

-- Update messages table to have sender_id instead of user_id for clarity
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);

-- Copy data from user_id to sender_id if it doesn't exist
UPDATE public.messages 
SET sender_id = user_id 
WHERE sender_id IS NULL;

-- Add index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- Add RLS policies for the new structure
CREATE POLICY IF NOT EXISTS "Users can view conversations they participate in v2" 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id OR auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can create direct conversations" 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id OR auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can send messages with sender_id" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id AND (user1_id = auth.uid() OR user2_id = auth.uid() OR created_by = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  ));
