-- Add indexes for efficient cursor-based sorting
CREATE INDEX IF NOT EXISTS idx_products_retail_price ON products(retail_price, id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name, id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at, id);