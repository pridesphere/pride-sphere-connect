-- Comprehensive database setup script for Supabase project
-- This script creates all tables, RLS policies, functions, and triggers

-- First, create the timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  username text,
  display_name text,
  pronouns text,
  bio text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  location text,
  interests text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create communities table
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  banner_url text,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  member_count integer DEFAULT 1,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communities
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only creators can update their communities" 
ON public.communities 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete their communities" 
ON public.communities 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for communities
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create community_memberships table
CREATE TABLE public.community_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS on community_memberships
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;

-- Create security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.user_is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_memberships
    WHERE community_id = _community_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_community_admin(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_memberships
    WHERE community_id = _community_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create RLS policies for community_memberships
CREATE POLICY "Users can view memberships in their communities" 
ON public.community_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  public.user_is_community_member(community_id, auth.uid())
);

CREATE POLICY "Users can join communities" 
ON public.community_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities or owners can remove members" 
ON public.community_memberships 
FOR DELETE 
USING (
  user_id = auth.uid() OR 
  public.user_is_community_admin(community_id, auth.uid())
);

CREATE POLICY "Community owners and members can update memberships" 
ON public.community_memberships 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  public.user_is_community_admin(community_id, auth.uid())
);

-- Create trigger for community_memberships
CREATE TRIGGER update_community_memberships_updated_at
BEFORE UPDATE ON public.community_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET member_count = (
      SELECT COUNT(*) FROM public.community_memberships 
      WHERE community_id = NEW.community_id
    )
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET member_count = (
      SELECT COUNT(*) FROM public.community_memberships 
      WHERE community_id = OLD.community_id
    )
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to update member count
CREATE TRIGGER update_community_member_count_trigger
AFTER INSERT OR DELETE ON public.community_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_community_member_count();

-- Create posts table
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  community_id uuid,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  hashtags text[] DEFAULT '{}',
  mood text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for posts
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  name text,
  is_group boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Create trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create conversation_participants table
CREATE TABLE public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_participants
CREATE POLICY "Users can join conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view participants in their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_reactions
CREATE POLICY "Users can react to messages" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_reactions.message_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Message reactions are viewable by participants" 
ON public.message_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_reactions.message_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  price integer DEFAULT 0,
  max_attendees integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
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

-- Create trigger for events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create event_attendees table
CREATE TABLE public.event_attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_attendees
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

-- Create calls table
CREATE TABLE public.calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  call_type text NOT NULL,
  status text NOT NULL DEFAULT 'initiated',
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calls
CREATE POLICY "Users can initiate calls" 
ON public.calls 
FOR INSERT 
WITH CHECK (
  auth.uid() = caller_id AND 
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = calls.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Call participants can view calls" 
ON public.calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = calls.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Call participants can update calls" 
ON public.calls 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = calls.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Create user_settings table
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'system',
  notifications_enabled boolean DEFAULT true,
  calls_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
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

-- Create trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();