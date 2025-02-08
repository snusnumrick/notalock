-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  retail_price DECIMAL(10, 2),
  business_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS and add policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public Read Access" ON public.products
  FOR SELECT USING (true);

-- Policy for admin write access
CREATE POLICY "Admin Write Access" ON public.products
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create test product if not exists
INSERT INTO public.products (id, name, sku) VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'Test Product', 'TEST-001')
ON CONFLICT (id) DO NOTHING;
