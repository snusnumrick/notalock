-- Drop existing policies first
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for product images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Admin full access policy with corrected JOIN condition
CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE profiles.role = 'admin'
    AND auth.users.id = auth.uid()
  )
);

-- Also add a separate insert policy to be more permissive for uploads
CREATE POLICY "Admin Insert Objects"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE profiles.role = 'admin'
    AND auth.users.id = auth.uid()
  )
);

-- Update policies for product_images table too
DROP POLICY IF EXISTS "Admin All Access" ON public.product_images;

CREATE POLICY "Admin All Access"
ON public.product_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE profiles.role = 'admin'
    AND auth.users.id = auth.uid()
  )
);