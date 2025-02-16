-- Remove category_id column since we already have product_categories table
ALTER TABLE products DROP COLUMN IF EXISTS category_id;