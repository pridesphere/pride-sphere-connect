-- Fix the handle_new_user function to properly handle both email signup and OAuth signin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  extracted_username text;
  extracted_display_name text;
BEGIN
  -- Extract username from metadata or generate from email
  extracted_username := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  
  -- Extract display name from metadata or use email name
  extracted_display_name := COALESCE(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  
  -- Insert profile with extracted or generated values
  INSERT INTO public.profiles (
    user_id, 
    username, 
    display_name,
    pronouns,
    bio
  ) VALUES (
    new.id, 
    extracted_username,
    extracted_display_name,
    new.raw_user_meta_data->>'pronouns',
    new.raw_user_meta_data->>'bio'
  );
  
  -- Assign free membership tier
  INSERT INTO public.user_memberships (user_id, membership_tier_id)
  SELECT new.id, id FROM public.membership_tiers WHERE name = 'Free' LIMIT 1;
  
  RETURN new;
END;
$$;