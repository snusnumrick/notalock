-- Drop existing policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Allow admin users to create objects in the product-images bucket
CREATE POLICY "Admin Create Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Allow admin users to update objects in the product-images bucket
CREATE POLICY "Admin Update Objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Allow admin users to delete ANY objects in the product-images bucket
CREATE POLICY "Admin Delete Objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Update bucket configuration
UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 10485760
WHERE id = 'product-images';

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;