-- Ensure product_categories table exists
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, category_id)
);

-- Copy existing category relationships to junction table
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id
FROM products
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Drop the dependent view first
DROP VIEW IF EXISTS product_with_categories;

-- Drop the category_id column
ALTER TABLE products DROP COLUMN category_id;

-- Recreate the view without category_id
CREATE VIEW product_with_categories AS
SELECT 
    p.*,
    c.name as category_name,
    c.id as category_id
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Products categories are viewable by everyone"
    ON product_categories FOR SELECT
    USING (true);

CREATE POLICY "Product categories are editable by admins"
    ON product_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );