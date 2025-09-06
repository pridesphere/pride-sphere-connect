-- Create sample conversations and messages for testing

-- First, let's create a sample conversation
INSERT INTO conversations (id, is_group, name, created_by) 
SELECT 
    gen_random_uuid(),
    false,
    NULL,
    profiles.user_id
FROM profiles 
LIMIT 1;

-- Get the conversation ID and user ID for further setup
DO $$ 
DECLARE
    sample_conv_id uuid;
    sample_user_id uuid;
    second_user_id uuid;
BEGIN
    -- Get a sample user
    SELECT user_id INTO sample_user_id FROM profiles LIMIT 1;
    
    -- Create or get another user for testing (create a test profile if needed)
    INSERT INTO profiles (user_id, display_name, username)
    SELECT 
        gen_random_uuid(),
        'Sky Carson',
        'sky_carson'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Sky Carson');
    
    SELECT user_id INTO second_user_id FROM profiles WHERE display_name = 'Sky Carson';
    
    -- Create a conversation between the users
    INSERT INTO conversations (id, is_group, created_by)
    VALUES (gen_random_uuid(), false, sample_user_id)
    RETURNING id INTO sample_conv_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
        (sample_conv_id, sample_user_id),
        (sample_conv_id, second_user_id);
    
    -- Add some sample messages
    INSERT INTO messages (conversation_id, user_id, content, message_type)
    VALUES 
        (sample_conv_id, second_user_id, 'Hey! How are you doing? 🌈', 'text'),
        (sample_conv_id, sample_user_id, 'I''m doing great! Thanks for asking 😊', 'text'),
        (sample_conv_id, second_user_id, 'That''s awesome! Want to chat more about your experiences in the community?', 'text');
        
    -- Create a group conversation
    INSERT INTO conversations (id, is_group, name, created_by)
    VALUES (gen_random_uuid(), true, 'LGBTQ+ Support Group 🏳️‍🌈', sample_user_id)
    RETURNING id INTO sample_conv_id;
    
    -- Add users to the group
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
        (sample_conv_id, sample_user_id),
        (sample_conv_id, second_user_id);
    
    -- Add a welcome message
    INSERT INTO messages (conversation_id, user_id, content, message_type)
    VALUES 
        (sample_conv_id, sample_user_id, 'Welcome to our support group! This is a safe space for everyone. Feel free to share and ask questions. 💜', 'text');
        
END $$;