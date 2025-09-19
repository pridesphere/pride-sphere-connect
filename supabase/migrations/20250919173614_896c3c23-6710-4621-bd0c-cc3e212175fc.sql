-- Update existing profiles with missing display names to use email prefixes
UPDATE public.profiles 
SET display_name = COALESCE(
    NULLIF(display_name, ''),
    NULLIF(username, ''),
    split_part((SELECT email FROM auth.users WHERE id = profiles.user_id), '@', 1)
)
WHERE (display_name IS NULL OR display_name = '') 
  AND user_id IN (SELECT id FROM auth.users);

-- Update existing profiles with missing usernames to use email prefixes  
UPDATE public.profiles 
SET username = COALESCE(
    NULLIF(username, ''),
    NULLIF(display_name, ''),
    split_part((SELECT email FROM auth.users WHERE id = profiles.user_id), '@', 1)
)
WHERE (username IS NULL OR username = '') 
  AND user_id IN (SELECT id FROM auth.users);