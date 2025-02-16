-- Create category_products junction table
CREATE TABLE category_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, product_id)
);

-- Create indexes for performance
CREATE INDEX idx_category_products_category ON category_products(category_id);
CREATE INDEX idx_category_products_product ON category_products(product_id);

-- Enable RLS
ALTER TABLE category_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Products are viewable by everyone"
    ON category_products FOR SELECT
    USING (true);

CREATE POLICY "Products are editable by admins"
    ON category_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

-- Move existing category relationships to the junction table
INSERT INTO category_products (category_id, product_id)
SELECT category_id, id 
FROM products 
WHERE category_id IS NOT NULL;

-- Remove category_id from products table
ALTER TABLE products DROP COLUMN category_id;