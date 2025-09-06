-- Remove all example/fake posts that are not from real authenticated users
-- Keep only posts from users who actually have profiles (real users)

-- Delete posts without valid user profiles (fake/example posts)
DELETE FROM posts 
WHERE user_id NOT IN (
    SELECT user_id FROM profiles WHERE user_id IS NOT NULL
);

-- Also clean up any posts that might be example content
-- (You can be more specific about what constitutes "fake" content if needed)
DELETE FROM posts 
WHERE content LIKE '%example%' 
   OR content LIKE '%test%' 
   OR content LIKE '%fake%' 
   OR content LIKE '%sample%'
   OR content LIKE '%lorem%'
   OR content LIKE '%ipsum%';