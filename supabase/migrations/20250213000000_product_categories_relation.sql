-- Add featured column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (product_id, category_id)
);

-- Enable RLS on product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public Read Access" ON public.product_categories
  FOR SELECT USING (true);

-- Policy for admin write access
CREATE POLICY "Admin Write Access" ON public.product_categories
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

-- Create views for easier querying
CREATE OR REPLACE VIEW product_with_categories AS
  SELECT 
    p.*,
    COALESCE(
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'
    ) as categories
  FROM products p
  LEFT JOIN product_categories pc ON p.id = pc.product_id
  LEFT JOIN categories c ON pc.category_id = c.id
  GROUP BY p.id;

-- Grant access to the view
GRANT SELECT ON product_with_categories TO PUBLIC;

-- Create sample featured products with categories if none exist
DO $$
DECLARE
  test_product_id UUID;
  door_handles_cat_id UUID;
  premium_cat_id UUID;
BEGIN
  -- Only proceed if we have no featured products
  IF NOT EXISTS (SELECT 1 FROM products WHERE featured = true) THEN
    -- Create test categories if they don't exist
    INSERT INTO categories (name, slug, description)
    VALUES ('Door Handles', 'door-handles', 'Premium door handles and levers')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO door_handles_cat_id;

    INSERT INTO categories (name, slug, description)
    VALUES ('Premium', 'premium', 'Premium quality products')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO premium_cat_id;

    -- Create a featured product
    INSERT INTO products (
      name,
      description,
      retail_price,
      featured,
      sku
    ) VALUES (
      'Milano Premium Handle',
      'Elegant door handle with modern Italian design',
      299.99,
      true,
      'MIL-001'
    )
    RETURNING id INTO test_product_id;

    -- Add categories to the product
    INSERT INTO product_categories (product_id, category_id)
    VALUES 
      (test_product_id, door_handles_cat_id),
      (test_product_id, premium_cat_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;