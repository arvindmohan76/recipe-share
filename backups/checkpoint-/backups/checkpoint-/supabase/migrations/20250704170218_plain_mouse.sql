/*
  # Create recipe images storage bucket

  1. Storage Setup
    - Create `recipe-images` bucket for storing recipe photos
    - Set public access for viewing images
    - Configure file size limit (5MB) and allowed MIME types
    - Handle case where bucket might already exist

  2. Security
    - Bucket is public for read access
    - Upload permissions controlled by application logic
*/

-- Create the recipe-images bucket (only if it doesn't exist)
DO $$
BEGIN
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
  END IF;
END $$;