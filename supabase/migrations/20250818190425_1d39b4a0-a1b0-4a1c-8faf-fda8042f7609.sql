-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  price INTEGER DEFAULT 0, -- in cents
  max_attendees INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies for event_attendees
CREATE POLICY "Event attendees are viewable by everyone" 
ON public.event_attendees 
FOR SELECT 
USING (true);

CREATE POLICY "Users can RSVP to events" 
ON public.event_attendees 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP" 
ON public.event_attendees 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own RSVP" 
ON public.event_attendees 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reactions
CREATE POLICY "Message reactions are viewable by participants" 
ON public.message_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    JOIN public.messages m ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can react to messages" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    JOIN public.messages m ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_settings table (referenced in Messages.tsx)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  calls_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create calls table (referenced in Messages.tsx)
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'initiated',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies for calls
CREATE POLICY "Call participants can view calls" 
ON public.calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = calls.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can initiate calls" 
ON public.calls 
FOR INSERT 
WITH CHECK (
  auth.uid() = caller_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = calls.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Call participants can update calls" 
ON public.calls 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = calls.conversation_id AND user_id = auth.uid()
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();