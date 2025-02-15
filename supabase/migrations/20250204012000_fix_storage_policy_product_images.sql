-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Test Directory Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for product images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Admin full access policy for product images
CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Update bucket configuration
UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 10485760
WHERE id = 'product-images';