-- Add theme_accent column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_accent TEXT DEFAULT 'rainbow';

-- Add a check constraint to ensure valid theme values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_theme_accent 
CHECK (theme_accent IN ('rainbow', 'trans', 'lesbian', 'bi', 'pan', 'ace'));