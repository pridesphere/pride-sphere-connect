-- Create sample conversations for existing users
-- This will only work if users are already signed up and have profiles

DO $$ 
DECLARE
    user1_id uuid;
    user2_id uuid;
    sample_conv_id uuid;
BEGIN
    -- Get existing users (if any)
    SELECT user_id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
    SELECT user_id INTO user2_id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- Only create sample data if we have at least one user
    IF user1_id IS NOT NULL THEN
        -- Create a self-conversation for testing
        INSERT INTO conversations (id, is_group, name, created_by)
        VALUES (gen_random_uuid(), false, NULL, user1_id)
        RETURNING id INTO sample_conv_id;
        
        -- Add the user as a participant
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (sample_conv_id, user1_id);
        
        -- Add a welcome message
        INSERT INTO messages (conversation_id, user_id, content, message_type)
        VALUES (sample_conv_id, user1_id, 'Welcome to PrideSphere messaging! 🌈 This is your test conversation. Try sending a message!', 'text');
        
        -- If we have a second user, create a conversation between them
        IF user2_id IS NOT NULL AND user2_id != user1_id THEN
            INSERT INTO conversations (id, is_group, created_by)
            VALUES (gen_random_uuid(), false, user1_id)
            RETURNING id INTO sample_conv_id;
            
            -- Add both users as participants
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES 
                (sample_conv_id, user1_id),
                (sample_conv_id, user2_id);
            
            -- Add sample messages
            INSERT INTO messages (conversation_id, user_id, content, message_type)
            VALUES 
                (sample_conv_id, user2_id, 'Hey! How are you doing? 🌈', 'text'),
                (sample_conv_id, user1_id, 'I''m doing great! Thanks for asking 😊', 'text');
        END IF;
        
        -- Create a group conversation
        INSERT INTO conversations (id, is_group, name, created_by)
        VALUES (gen_random_uuid(), true, 'LGBTQ+ Support Group 🏳️‍🌈', user1_id)
        RETURNING id INTO sample_conv_id;
        
        -- Add user to the group
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (sample_conv_id, user1_id);
        
        -- Add a welcome message
        INSERT INTO messages (conversation_id, user_id, content, message_type)
        VALUES (sample_conv_id, user1_id, 'Welcome to our support group! This is a safe space for everyone. Feel free to share and ask questions. 💜', 'text');
    END IF;
END $$;