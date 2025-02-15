-- Add is_visible column to categories table
ALTER TABLE categories ADD COLUMN is_visible boolean DEFAULT true NOT NULL;

-- Update existing records to be visible by default
UPDATE categories SET is_visible = true;