-- Add explicit delete policy for admins
CREATE POLICY "Admin Delete Access" ON public.products
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );