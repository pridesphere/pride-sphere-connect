-- Create community_memberships table
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_memberships
CREATE POLICY "Users can view memberships in their communities"
ON public.community_memberships
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.community_memberships cm 
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join communities"
ON public.community_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Community owners and members can update memberships"
ON public.community_memberships
FOR UPDATE
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.community_memberships cm 
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can leave communities or owners can remove members"
ON public.community_memberships
FOR DELETE
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.community_memberships cm 
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

-- Add is_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Create trigger for community_memberships updated_at
CREATE TRIGGER update_community_memberships_updated_at
  BEFORE UPDATE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update member count
CREATE TRIGGER update_member_count_trigger
  AFTER INSERT OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_member_count();