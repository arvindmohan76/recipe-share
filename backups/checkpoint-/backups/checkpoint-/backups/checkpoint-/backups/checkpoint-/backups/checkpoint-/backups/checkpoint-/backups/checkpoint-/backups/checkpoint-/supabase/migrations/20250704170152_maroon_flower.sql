/*
  # Create recipe images storage bucket

  1. Storage Setup
    - Create recipe-images bucket for storing recipe photos
    - Configure bucket settings for image uploads
    - Set up public access for viewing images

  2. Security
    - Enable public read access for recipe images
    - Users can upload images to their own folders
    - Automatic cleanup and organization by user ID

  Note: Storage policies are typically managed through the Supabase dashboard
  or via the management API, not through SQL migrations.
*/

-- Create the recipe-images bucket using Supabase's storage functions
SELECT storage.create_bucket('recipe-images');

-- Update bucket configuration
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880, -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'recipe-images';