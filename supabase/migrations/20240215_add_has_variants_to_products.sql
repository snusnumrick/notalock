-- Add has_variants column to products table
ALTER TABLE products 
ADD COLUMN has_variants BOOLEAN NOT NULL DEFAULT false;

-- Update existing products (optional)
UPDATE products 
SET has_variants = EXISTS (
    SELECT 1 
    FROM product_variants 
    WHERE product_variants.product_id = products.id
);

-- Add an index for performance
CREATE INDEX idx_products_has_variants ON products(has_variants);