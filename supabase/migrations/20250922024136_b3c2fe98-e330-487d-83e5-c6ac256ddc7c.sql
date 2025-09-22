-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  related_id UUID NULL, -- For friend request ID, etc.
  data JSONB NULL, -- Additional data like requester info
  link TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requester_profile RECORD;
BEGIN
  -- Get requester profile info
  SELECT display_name, username, avatar_url 
  INTO requester_profile
  FROM profiles 
  WHERE user_id = NEW.requester_id;

  -- Create notification for the addressee
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    data
  ) VALUES (
    NEW.addressee_id,
    'Friend Request',
    COALESCE(requester_profile.display_name, requester_profile.username, 'Someone') || ' sent you a friend request',
    'friend_request',
    NEW.id,
    jsonb_build_object(
      'requester_id', NEW.requester_id,
      'requester_name', COALESCE(requester_profile.display_name, requester_profile.username),
      'requester_avatar', requester_profile.avatar_url
    )
  );

  RETURN NEW;
END;
$$;

-- Function to create friend request accepted notification and conversation
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  addressee_profile RECORD;
  conversation_id UUID;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Get addressee profile info
    SELECT display_name, username, avatar_url 
    INTO addressee_profile
    FROM profiles 
    WHERE user_id = NEW.addressee_id;

    -- Create notification for the requester
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_id,
      data
    ) VALUES (
      NEW.requester_id,
      'Friend Request Accepted',
      COALESCE(addressee_profile.display_name, addressee_profile.username, 'Someone') || ' accepted your friend request. You can now chat!',
      'friend_accepted',
      NEW.id,
      jsonb_build_object(
        'friend_id', NEW.addressee_id,
        'friend_name', COALESCE(addressee_profile.display_name, addressee_profile.username),
        'friend_avatar', addressee_profile.avatar_url
      )
    );

    -- Create a conversation between the two users
    INSERT INTO conversations (created_by, is_group)
    VALUES (NEW.requester_id, false)
    RETURNING id INTO conversation_id;

    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (conversation_id, NEW.requester_id),
    (conversation_id, NEW.addressee_id);

    -- Mark the friend request notification as read
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = NEW.addressee_id 
    AND related_id = NEW.id 
    AND type = 'friend_request';
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION create_friend_request_notification();

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_accepted();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;