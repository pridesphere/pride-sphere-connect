-- Create storage bucket for community banners
INSERT INTO storage.buckets (id, name, public) VALUES ('community-banners', 'community-banners', true);

-- Create policies for community banner uploads
CREATE POLICY "Community banners are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'community-banners');

CREATE POLICY "Authenticated users can upload community banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'community-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own community banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'community-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own community banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'community-banners' AND auth.uid() IS NOT NULL);