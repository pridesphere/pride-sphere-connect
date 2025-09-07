-- Remove posts from users without proper profile information (likely fake/example users)
DELETE FROM posts 
WHERE user_id IN (
    SELECT user_id FROM profiles 
    WHERE (username IS NULL OR username = '') 
    AND (display_name IS NULL OR display_name = '')
);

-- Also remove any posts from users who don't have profiles at all
DELETE FROM posts 
WHERE user_id NOT IN (
    SELECT user_id FROM profiles 
    WHERE username IS NOT NULL 
    AND display_name IS NOT NULL
);