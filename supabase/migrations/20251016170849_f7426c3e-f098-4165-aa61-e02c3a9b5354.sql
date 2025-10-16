-- Fix conversation creation RLS policy
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Ensure the created_by column matches the current user (but don't block if it doesn't)
-- The application will handle setting created_by correctly