-- Drop existing policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Create Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Objects" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Allow admin users to perform all operations on test uploads
CREATE POLICY "Admin Test Directory Access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images' 
  AND storage.foldername(name) = 'test-uploads'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);