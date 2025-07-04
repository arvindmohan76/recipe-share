/*
  # Create recipe-images storage bucket

  1. Storage Setup
    - Create `recipe-images` bucket for storing recipe photos
    - Enable public access for uploaded images
    - Set up RLS policies for secure access

  2. Security
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Restrict delete/update to file owners
*/

-- Create the recipe-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Users can upload recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to recipe images
CREATE POLICY "Public can view recipe images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update own recipe images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'recipe-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete own recipe images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);