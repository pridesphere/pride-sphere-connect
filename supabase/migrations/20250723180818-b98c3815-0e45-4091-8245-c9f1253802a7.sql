-- Fix search path for functions to prevent security warnings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');
  
  -- Assign free membership tier
  INSERT INTO public.user_memberships (user_id, membership_tier_id)
  SELECT new.id, id FROM public.membership_tiers WHERE name = 'Free' LIMIT 1;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Fix search path for update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Enable RLS on membership_tiers table that was missed
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy for membership_tiers (read-only for everyone)
CREATE POLICY "Anyone can view membership tiers" ON public.membership_tiers FOR SELECT USING (true);