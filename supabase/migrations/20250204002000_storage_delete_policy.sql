-- Create or update storage policy for deleting objects
DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;

-- Create policy to allow admin users to delete objects
CREATE POLICY "Admin Delete Objects"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);