-- Create storage bucket for product images
-- Run this in Supabase SQL Editor

-- Insert the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- public read access
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access for product-images bucket
CREATE POLICY IF NOT EXISTS "Public read product-images"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- Authenticated users can upload/update product images
CREATE POLICY IF NOT EXISTS "Authenticated write product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Authenticated users can update their uploaded images
CREATE POLICY IF NOT EXISTS "Authenticated update product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Authenticated users can delete product images
CREATE POLICY IF NOT EXISTS "Authenticated delete product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Grant storage permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
