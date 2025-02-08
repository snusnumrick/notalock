-- Drop existing policies first
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for product images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Admin full access policy - single policy for all operations
CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE profiles.role = 'admin'
    )
  )
);

-- Enable upload, delete access on the bucket itself
UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 10485760
WHERE id = 'product-images';
