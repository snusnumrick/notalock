-- Drop existing policies first
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Objects" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for product images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Admin insert policy that checks permissions table
CREATE POLICY "Admin Insert Access"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND can_manage_products = true
  )
);

-- 3. Admin full access policy
CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND can_manage_products = true
  )
);

-- Update product_images table policies
DROP POLICY IF EXISTS "Admin All Access" ON public.product_images;

-- Use the same permission check for product_images
CREATE POLICY "Admin Product Images Access"
ON public.product_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND can_manage_products = true
  )
);

-- Add policy for public read access to product images
CREATE POLICY "Public Read Product Images"
ON public.product_images
FOR SELECT
USING (true);