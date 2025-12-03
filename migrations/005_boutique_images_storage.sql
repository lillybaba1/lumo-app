-- Create storage bucket for boutique images (logos and banners)
-- Run this in Supabase SQL Editor

-- Insert the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boutique-images',
  'boutique-images',
  true,  -- public read access
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access for boutique-images bucket
DROP POLICY IF EXISTS "Public read boutique-images" ON storage.objects;
CREATE POLICY "Public read boutique-images"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'boutique-images' );

-- Authenticated users can upload boutique images
DROP POLICY IF EXISTS "Authenticated upload boutique-images" ON storage.objects;
CREATE POLICY "Authenticated upload boutique-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'boutique-images' );

-- Authenticated users can update their boutique images
DROP POLICY IF EXISTS "Authenticated update boutique-images" ON storage.objects;
CREATE POLICY "Authenticated update boutique-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING ( bucket_id = 'boutique-images' );

-- Authenticated users can delete their boutique images
DROP POLICY IF EXISTS "Authenticated delete boutique-images" ON storage.objects;
CREATE POLICY "Authenticated delete boutique-images"
ON storage.objects
FOR DELETE
TO authenticated
USING ( bucket_id = 'boutique-images' );
