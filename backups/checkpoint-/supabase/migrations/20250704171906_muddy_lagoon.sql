/*
  # Fix Storage Bucket Setup

  1. Storage Configuration
    - Create recipe-images bucket with proper configuration
    - Set up RLS policies for secure access
    - Enable public read access for recipe images

  2. Security
    - Users can upload images to their own folder
    - Public can view all recipe images
    - Users can manage their own images
*/

-- Create the recipe-images bucket if it doesn't exist
DO $$
BEGIN
  -- Check if bucket exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'recipe-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'recipe-images',
      'recipe-images',
      true,
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  ELSE
    -- Update existing bucket to ensure correct settings
    UPDATE storage.buckets 
    SET 
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    WHERE id = 'recipe-images';
  END IF;
END $$;

-- Ensure RLS is enabled on storage.objects
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe images" ON storage.objects;

-- Policy: Allow authenticated users to upload images to their folder
CREATE POLICY "Users can upload recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
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
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete own recipe images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);