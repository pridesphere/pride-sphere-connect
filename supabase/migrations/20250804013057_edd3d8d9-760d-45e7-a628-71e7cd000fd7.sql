-- Create message_reactions table for emoji reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message reactions
CREATE POLICY "Users can view reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create calls table for audio/video calls
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'answered', 'ended', 'declined')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies for calls
CREATE POLICY "Participants can view calls" ON public.calls FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = calls.conversation_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create calls in their conversations" ON public.calls FOR INSERT 
  WITH CHECK (auth.uid() = caller_id AND EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = calls.conversation_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Participants can update calls" ON public.calls FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = calls.conversation_id 
    AND user_id = auth.uid()
  ));

-- Add media support to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create user_settings table for privacy preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  calls_enabled BOOLEAN DEFAULT true,
  dms_enabled BOOLEAN DEFAULT true,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();