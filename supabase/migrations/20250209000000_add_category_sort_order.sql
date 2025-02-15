-- Add sort_order column to categories table
ALTER TABLE categories ADD COLUMN sort_order integer DEFAULT 0 NOT NULL;

-- Update existing records with incremental sort order
WITH indexed_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM categories
)
UPDATE categories c
SET sort_order = ic.row_num
FROM indexed_categories ic
WHERE c.id = ic.id;