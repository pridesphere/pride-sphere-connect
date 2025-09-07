-- Add location field to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location TEXT;