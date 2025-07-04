-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated users can upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own recipe images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own recipe images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );