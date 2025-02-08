-- Drop existing policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Create Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Test Directory Access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Common function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Public read access for all product images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Admin full access for test-uploads directory
CREATE POLICY "Admin Test Uploads Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND name LIKE 'test-uploads/%'
  AND is_admin()
);

-- 3. Admin full access for product subdirectories
CREATE POLICY "Admin Product Images Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  AND is_admin()
);